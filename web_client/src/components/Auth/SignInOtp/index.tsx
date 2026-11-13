"use client"
import React, { useRef, useState } from "react";
import { loginWithOTP } from "@/http/apiCalls";
import { getAlertContent, VERIFY_OTP_TYPES } from "@/utils/constants";
import Link from "next/link";
import VerifyOTP from "../VerifyOTP";
import ModalInfo from "@/components/Common/ModalInfo";
import GoogleLoginButton from "../GoogleLoginButton";
import { rateLimitManager } from "@/http/rateLimitManager";

const SigninOtp = () => {
  const [alert, setAlert] = useState(null);
  const [enterOTP, setEnterOTP] = useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const emailRef = useRef('');

  React.useEffect(() => {
    const unsub = rateLimitManager.subscribe((st) => {
      setRateLimitSeconds(st.isRateLimited ? st.retryAfter : 0);
    });
    return unsub;
  }, []);

  const handleSubmit = async(e) => {
    try {
      e.preventDefault();
      const formData = new FormData(e.target);
      const values = Object.fromEntries(formData.entries());
      const response = await loginWithOTP(values);
      if(response.success){
        setEnterOTP(true);
        emailRef.current = values.email.toString();
      }
    } catch (error) {
      console.log(error);
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
      onClose={onOTPVerificationClose} type={VERIFY_OTP_TYPES.LOGIN} resendOtp={resendOtp} />
      <section className="page-section">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="form-card max-w-[570px] w-full mx-auto">
            <div className="text-center mb-11">
              <h2 className="font-semibold text-xl sm:text-2xl xl:text-heading-5 text-dark mb-1.5">
                Sign-In with OTP
              </h2>
              <p>Enter your detail below</p>
            </div>
            <div className="mt-5.5">
              <form id="sign-up" onSubmit={handleSubmit}>
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

                <button
                  type="submit"
                  disabled={rateLimitSeconds > 0}
                  className={`btn-primary mt-7.5 w-full ${rateLimitSeconds > 0 ? "opacity-60 cursor-not-allowed !bg-amber-600" : ""}`}
                >
                  {rateLimitSeconds > 0 ? `Please wait ${rateLimitSeconds}s...` : "Send OTP"}
                </button>

                <div className="p-3 mt-5">
                  <GoogleLoginButton />
                </div>

                <Link
                  href="/signin"
                  className="block text-center text-dark-4 mt-4.5 ease-out duration-200 hover:text-dark"
                >
                  Signin with password
                </Link>

                <Link
                  href="/reset-password"
                  className="block text-center text-dark-4 mt-4.5 ease-out duration-200 hover:text-dark"
                >
                  Forget your password?
                </Link>

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

export default SigninOtp;
