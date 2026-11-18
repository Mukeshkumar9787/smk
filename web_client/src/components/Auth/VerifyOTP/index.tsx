"use client"
import { verifyOTP } from "@/http/apiCalls";
import { Button, Modal } from "antd";
import { useRouter } from "next/navigation";
import ResendButton from "../../Common/ResendButton";
import { afterSucessfullLogin } from "@/utils/helper";
import { VERIFY_OTP_TYPES } from "@/utils/constants";
import { notifySuccess } from "@/utils/notify";
import { withTenantPath } from "@/lib/tenantUrl";

const VerifyOTP = ({ type, sentTo=null, isOpen, onClose, resendOtp=null, nestedForm=false }) => {
  const router = useRouter();
  
  const handleSubmit = async(e) => {
      e.preventDefault();
      try {
        const formData = new FormData(e.target);
        const values = Object.fromEntries(formData.entries());
        const response = await verifyOTP({...values, type});
        if(response.success){
          if(type === VERIFY_OTP_TYPES.RESET_PASSWORD){
            notifySuccess("Password changed successfully.");
            if(nestedForm){
              onClose(true);
            }else{
              router.push(withTenantPath('/signin'));
            }
          }else{
            afterSucessfullLogin(response.data.token);
          }
        }
      } catch (error) {
        console.log(error);
      }
    }
  console.log(nestedForm, 'nestedForm')
  let footer = nestedForm ? [] : [<Button key="extra" onClick={onClose}>Change mail</Button>];
  footer = [
    ...footer,
    <ResendButton key="cancel" onClick={resendOtp}/>,
    <Button key="ok" type="primary" className="bg-blue text-white" htmlType= 'submit' form='otpForm' >
      Verify
    </Button>
    ];
  return (
    <Modal centered open={isOpen} 
      onCancel={onClose} 
      okButtonProps={{style: {backgroundColor: 'blue', color: 'white'}}}
      footer={footer}
      >
      <div>
          <form id="otpForm" onSubmit={handleSubmit}>
            <div className="mb-5">
              <label htmlFor="email" className="form-label">
                Email sent to <span className="font-bold">{sentTo}</span>
              </label>
              <input
                type={"email"}
                name="email"
                id="email"
                hidden
                readOnly
                value={sentTo}
                placeholder="Enter your email"
                className="form-input"
              />
            </div>

            <div className="mb-5">
              <label htmlFor="otp" className="form-label">
                OTP
              </label>
              
              <input
                type="number"
                name="otp"
                id="password"
                placeholder="Enter your OTP"
                autoComplete="on"
                minLength={6}
                maxLength={6}
                className="form-input"
              />
            </div>
          </form>
      </div>
    </Modal>
  );
};

export default VerifyOTP;
