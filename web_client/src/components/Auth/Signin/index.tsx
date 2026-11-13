"use client"
import React, { useEffect, useState, useRef } from "react";
import ModalInfo from "@/components/Common/ModalInfo";
import Link from "next/link";
import { afterSucessfullLogin } from "@/utils/helper";
import { login } from "@/http/apiCalls";
import PasswordInput from "@/components/Common/PasswordInput";
import { getAlertContent, PASSWORD_REGEX } from "@/utils/constants";
import GoogleLoginButton from "../GoogleLoginButton";
import TurnstileWidget, { TurnstileRef } from "@/components/Common/TurnstileWidget";
import { rateLimitManager } from "@/http/rateLimitManager";

const Signin = () => {
  const [alert, setAlert] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const turnstileRef = useRef<TurnstileRef>(null);

  useEffect(() => {
    const unsub = rateLimitManager.subscribe((st) => {
      setRateLimitSeconds(st.isRateLimited ? st.retryAfter : 0);
    });
    return unsub;
  }, []);
  
  useEffect(() => {
    let next = localStorage.getItem('loginToProceed'); 
    localStorage.removeItem('loginToProceed'); 
    if(next){
      setAlert('loginToProceed');
    }
  },[]);

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

      const response = await login(values);
      if(response.success){
        afterSucessfullLogin(response.data.token);
      } else {
        // Reset turnstile widget immediately on failure so a fresh token is generated for the next attempt
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
  return (
    <>
      <ModalInfo isOpen={alert} content={getAlertContent(alert)} closable={false} onOk={()=> {setAlert(null)}}  />
      <section className="page-section">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="form-card max-w-[570px] w-full mx-auto">
            <div className="text-center mb-11">
              <h2 className="font-semibold text-xl sm:text-2xl xl:text-heading-5 text-dark mb-1.5">
                Sign In to Your Account
              </h2>
              <p>Enter your detail below</p>
            </div>

            <div>
              <form onSubmit={handleSubmit}>
                <div className="mb-5">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    placeholder="Enter your email"
                    className="form-input"
                  />
                </div>

                <div className="mb-5">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>

                  <PasswordInput
                    type="password"
                    name="password"
                    id="password"
                    placeholder="Enter your password"
                    autoComplete="on"
                    minLength={8}
                    required
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
                    ? "Signing in..."
                    : "Sign in to account"}
                </button>

                <div className="p-3 mt-5">
                  <GoogleLoginButton />
                </div>

                <Link
                  href="/signin-otp"
                  className="block text-center text-dark-4 mt-4.5 ease-out duration-200 hover:text-dark"
                >
                  Signin&nbsp;with&nbsp;OTP
                </Link>

                <Link
                  href="/reset-password"
                  className="block text-center text-dark-4 mt-4.5 ease-out duration-200 hover:text-dark"
                >
                  Forget your password?
                </Link>


                <p className="text-center mt-6">
                  Don&apos;t have an account?
                  <Link
                    href="/signup"
                    className="text-dark ease-out duration-200 hover:text-blue pl-2"
                    >
                    Sign Up Now!
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

export default Signin;
