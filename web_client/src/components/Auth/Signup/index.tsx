"use client"
import React, { useRef, useState } from "react";
import { register } from "@/http/apiCalls";
import { getAlertContent, PASSWORD_MIN_LENGTH, PASSWORD_REGEX, VERIFY_OTP_TYPES } from "@/utils/constants";
import Link from "next/link";
import VerifyOTP from "../VerifyOTP";
import ModalInfo from "@/components/Common/ModalInfo";
import PasswordInput from "@/components/Common/PasswordInput";
import GoogleLoginButton from "../GoogleLoginButton";
import TurnstileWidget, { TurnstileRef } from "@/components/Common/TurnstileWidget";
import { rateLimitManager } from "@/http/rateLimitManager";

const Signup = () => {
  const [alert, setAlert] = useState(null);
  const [enterOTP, setEnterOTP] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailRef = useRef('');
  const turnstileRef = useRef<TurnstileRef>(null);

  React.useEffect(() => {
    const unsub = rateLimitManager.subscribe((st) => {
      setRateLimitSeconds(st.isRateLimited ? st.retryAfter : 0);
    });
    return unsub;
  }, []);

  const handleSubmit = async(e) => {
    try {
      e.preventDefault();
      if (isSubmitting) return;

      const formData = new FormData(e.target);
      const values = Object.fromEntries(formData.entries());

      if(!PASSWORD_REGEX.test(values.password.toString())){
        setAlert('regex');
        return
      }
      
      if (values.password !== values.confirmPassword) {
        setAlert('confirmPassword');
        return;
      }

      setIsSubmitting(true);

      // Actively generate/retrieve Cloudflare Turnstile token on submit
      let token = turnstileToken;
      if (turnstileRef.current) {
        token = await turnstileRef.current.getToken();
        if (token) {
          setTurnstileToken(token);
        }
      }

      if (token) {
        values.turnstileToken = token;
      }
      
      const response = await register(values);
      if(response.success){
        setEnterOTP(true);
        emailRef.current = values.email.toString();
      } else {
        turnstileRef.current?.reset();
        setTurnstileToken("");
      }
    } catch (error) {
      console.log(error);
      turnstileRef.current?.reset();
      setTurnstileToken("");
    } finally {
      setIsSubmitting(false);
    }
  }

  const onOTPVerificationClose = () => {
    setEnterOTP(false);
    emailRef.current = '';
  }

  const resendOtp = () => {
    const form = document.getElementById("sign-up") as HTMLFormElement;
    form?.requestSubmit(); // ✅ triggers handleSubmit
  }
  

  return (
    <>
      <ModalInfo isOpen={alert} content={getAlertContent(alert)} onClose={()=> {setAlert(null)}} onOk={()=> {setAlert(null)}}  />
      <VerifyOTP isOpen={enterOTP} sentTo={emailRef.current} 
      onClose={onOTPVerificationClose} type={VERIFY_OTP_TYPES.REGISTER} resendOtp={resendOtp} />
      <section className="page-section">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="form-card max-w-[570px] w-full mx-auto">
            <div className="text-center mb-11">
              <h2 className="font-semibold text-xl sm:text-2xl xl:text-heading-5 text-dark mb-1.5">
                Create an Account
              </h2>
              <p>Enter your detail below</p>
            </div>
            <div className="mt-5.5">
              <form id="sign-up" onSubmit={handleSubmit}>
                <div className="mb-5">
                  <label htmlFor="name" className="form-label">
                    Full Name <span className="text-red">*</span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    placeholder="Enter your full name"
                    className="form-input"
                  />
                </div>

                <div className="mb-5">
                  <label htmlFor="email" className="form-label">
                    Email Address <span className="text-red">*</span>
                  </label>

                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    placeholder="Enter your email address"
                    className="form-input"
                  />
                </div>

                <div className="mb-5">
                  <label htmlFor="mobile" className="form-label">
                    Mobile <span className="text-red">*</span>
                  </label>

                  <input
                    type="number"
                    name="mobile"
                    id="mobile"
                    required
                    placeholder="Enter your mobile"
                    className="form-input"
                  />
                </div>

                <div className="mb-5">
                  <label htmlFor="password" className="form-label">
                    Password <span className="text-red">*</span>
                  </label>

                  <PasswordInput
                    type="password"
                    name="password"
                    id="password"
                    required
                    placeholder="Enter your password"
                    autoComplete="on"
                    minLength={PASSWORD_MIN_LENGTH}
                    title="At least 6 characters, one uppercase letter, and one number"
                    className="form-input"
                  />
                </div>

                <div className="mb-5.5">
                  <label htmlFor="re-type-password" className="form-label">
                    Re-type Password <span className="text-red">*</span>
                  </label>

                  <PasswordInput
                    type="password"
                    name="confirmPassword"
                    id="re-type-password"
                    required
                    placeholder="Re-type your password"
                    autoComplete="on"
                    minLength={PASSWORD_MIN_LENGTH}
                    className="form-input"
                  />
                </div>

                <TurnstileWidget ref={turnstileRef} onVerify={(token) => setTurnstileToken(token)} />

                <button
                  type="submit"
                  disabled={rateLimitSeconds > 0 || isSubmitting}
                  className={`btn-primary mt-7.5 w-full ${(rateLimitSeconds > 0 || isSubmitting) ? "opacity-60 cursor-not-allowed !bg-amber-600" : ""}`}
                >
                  {rateLimitSeconds > 0
                    ? `Please wait ${rateLimitSeconds}s...`
                    : isSubmitting
                    ? "Creating Account..."
                    : "Create Account"}
                </button>

                <div className="p-3 mt-5">
                  <GoogleLoginButton />
                </div>

                <p className="text-center mt-6">
                  Already have an account?
                  <Link
                    href="/signin"
                    className="text-dark ease-out duration-200 hover:text-blue pl-2"
                  >
                    Sign in Now
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Signup;
