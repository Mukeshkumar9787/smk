"use client"
import React, { useRef, useState } from "react";
import { resetPassword } from "@/http/apiCalls";
import { getAlertContent, PASSWORD_MIN_LENGTH, PASSWORD_REGEX, VERIFY_OTP_TYPES } from "@/utils/constants";
import Link from "next/link";
import VerifyOTP from "../VerifyOTP";
import ModalInfo from "@/components/Common/ModalInfo";
import PasswordInput from "@/components/Common/PasswordInput";
import { rateLimitManager } from "@/http/rateLimitManager";

const ResetPassword = ({ email = '', nestedForm=false }) => {
  const [resetFormValue, setResetFormValue] = useState(false);
  const [alert, setAlert] = useState(null);
  const [enterOTP, setEnterOTP] = useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const emailRef = useRef(email);

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

      if(!PASSWORD_REGEX.test(values.password.toString())){
        setAlert('regex');
        return
      }
      
      if (values.password !== values.confirmPassword) {
        setAlert('confirmPassword');
        return;
      }
      
      const response = await resetPassword(values);
      if(response.success){
        setEnterOTP(true);
        emailRef.current = values.email.toString();
      }
    } catch (error) {
      console.log(error);
    }
  }

  const onOTPVerificationClose = (success=false) => {
    setEnterOTP(false);
    emailRef.current = '';
    if(success){
      setResetFormValue(prev => !prev);
    }
  }

  const resendOtp = () => {
    const form = document.getElementById("sign-up") as HTMLFormElement;
    form?.requestSubmit(); // ✅ triggers handleSubmit
  }
  

  return (
    <>
      <ModalInfo isOpen={alert} content={getAlertContent(alert)} onClose={()=> {setAlert(null)}} onOk={()=> {setAlert(null)}}  />
      {enterOTP && <VerifyOTP isOpen={enterOTP} sentTo={emailRef.current} 
      onClose={onOTPVerificationClose} type={VERIFY_OTP_TYPES.RESET_PASSWORD} resendOtp={resendOtp} nestedForm={nestedForm} /> }
      <section className={`${nestedForm ? "overflow-hidden bg-transparent" : "page-section"}`} key={`${resetFormValue}`}>
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="form-card max-w-[570px] w-full mx-auto">
            <div className="text-center mb-11">
              <h2 className="font-semibold text-xl sm:text-2xl xl:text-heading-5 text-dark mb-1.5">
                Reset password
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
                    defaultValue={email}
                    readOnly={nestedForm}
                    required
                    placeholder="Enter your email address"
                    className="form-input"
                  />
                </div>
                <div className="mb-5">
                  <label htmlFor="password" className="form-label">
                    New Password <span className="text-red">*</span>
                  </label>

                  <PasswordInput
                    type="password"
                    name="password"
                    id="password"
                    required
                    placeholder="Enter new password"
                    defaultValue={''}
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
                    defaultValue={''}
                    placeholder="Re-type new password"
                    autoComplete="on"
                    minLength={PASSWORD_MIN_LENGTH}
                    className="form-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={rateLimitSeconds > 0}
                  className={`btn-primary mt-7.5 w-full ${rateLimitSeconds > 0 ? "opacity-60 cursor-not-allowed !bg-amber-600" : ""}`}
                >
                  {rateLimitSeconds > 0 ? `Please wait ${rateLimitSeconds}s...` : "Reset Password"}
                </button>
                {!nestedForm && 
                  <>
                    <Link
                      href="/signin-otp"
                      className="block text-center text-dark-4 mt-4.5 ease-out duration-200 hover:text-dark"
                    >
                      Signin&nbsp;with&nbsp;OTP
                    </Link>

                    <Link
                      href="/signin"
                      className="block text-center text-dark-4 mt-4.5 ease-out duration-200 hover:text-dark"
                    >
                      Sign In with password
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
                  </>
                }
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ResetPassword;
