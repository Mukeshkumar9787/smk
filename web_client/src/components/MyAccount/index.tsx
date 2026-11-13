"use client";
import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { getLoggedInUserData, getMemberSince, getStoredToken, logout } from "@/utils/helper";
import { updateProfile } from "@/http/apiCalls";
import { Button, Popconfirm } from "antd";
import ResetPassword from "../Auth/ResetPassword";
import Addresses from "./Addresses";
import { notifySuccess, notifyError } from "@/utils/notify";
import FileUploader from "../Common/FileUploader";

const MyAccount = () => {
  const [activeTab, setActiveTab] = useState("account-details");
  const [user, setUser] = useState<any>({});
  const [profileImage, setProfileImage] = useState(null);
  const fileIdsRef = React.useRef(new Set());
  const deletedFileIdsRef = React.useRef(new Set());
  const [isImageModalOpen, setImageModalOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const fetchUserData = useCallback(async () => {
    const userData = await getLoggedInUserData();
    setUser(userData || {});
    setProfileImage(
      userData?.profilePicture
        ? { id: userData.profilePictureFileId, path: userData.profilePicture }
        : null
    );
  }, []);
  const tabs = [
    { key: "account-details", label: "Profile" },
    { key: "addresses", label: "Addresses" },
    { key: "reset-password", label: "Reset Password" },
  ];

  
  useEffect(()=>{
    if(!getStoredToken()) {
      window.location.href = '/';
      return
    };
    fetchUserData();
  },[fetchUserData])

  const sendProfileImageUpdate = useCallback(
    async (successMessage = "Profile updated.") => {
      try {
        const response = await updateProfile({
          name: user?.name || "",
          mobile: user?.mobile || "",
          email: user?.email || "",
          fileIds: [...fileIdsRef.current],
          deletedFileIds: [...deletedFileIdsRef.current],
        });
        notifySuccess(response.message || successMessage);
        await fetchUserData();
        deletedFileIdsRef.current.clear();
      } catch (error) {
        notifyError("Unable to update the profile image.");
      }
    },
    [fetchUserData, user]
  );

  const handleProfileUpdate = async (e) => {
    try {
      e.preventDefault();
      const formData = new FormData(e.target);
      const values = {
        ...Object.fromEntries(formData.entries()),
        fileIds: [...fileIdsRef.current],
        deletedFileIds: [...deletedFileIdsRef.current],
      };
      const response = await updateProfile(values);
      notifySuccess(response.message || "Profile updated.");
      window.location.reload();
    } catch (error) {
      
    }
  }

  const handleImageUploadSuccess = async () => {
    setImageModalOpen(false);
    await sendProfileImageUpdate("Profile image updated.");
  };

  const handleRemoveProfileImage = async () => {
    const currentId = profileImage?.id || user?.profilePictureFileId;
    if (currentId) {
      deletedFileIdsRef.current.add(currentId);
      if (fileIdsRef.current.has(currentId)) {
        fileIdsRef.current.delete(currentId);
      }
    }
    setProfileImage(null);
    setImageModalOpen(false);
    await sendProfileImageUpdate("Profile image removed.");
  };

  return (
    <>
      <section className="page-section">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="flex flex-col gap-7.5">
            {/* <!--== user dashboard menu start ==--> */}
            <div className="w-full bg-white rounded-xl shadow-1">
              <div className="flex flex-col">
                
                <div className="flex flex-wrap items-center gap-5 py-6 px-4 sm:px-7.5 xl:px-9 border-r xl:border-r-0 xl:border-b border-gray-3">
                  
                    <div className="h-24 w-24 flex-shrink-0 relative">
                      <FileUploader
                        files={profileImage}
                        setFiles={setProfileImage}
                        fileIdsRef={fileIdsRef}
                        deletedFileIdsRef={deletedFileIdsRef}
                        cropShape="round"
                        hideDropzone
                        hidePreviewList
                        onFileUploaded={handleImageUploadSuccess}
                        renderTrigger={({ inputProps, inputRef }) => {
                          const profileSrc = profileImage?.path || user?.profilePicture;
                          fileInputRef.current = inputRef.current;
                          return (
                            <>
                              <div
                                className="group relative flex h-full w-full cursor-pointer items-center justify-center overflow-hidden rounded-full border border-gray-200 transition duration-200 hover:ring-2 hover:ring-blue/70"
                                onClick={() => setImageModalOpen(true)}
                              >
                                {profileSrc ? (
                                  <img
                                    src={profileSrc}
                                    alt={user?.name || "user"}
                                    className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="relative flex h-full w-full items-center justify-center rounded-full bg-slate-100 p-5">
                                    <Image
                                      src="/images/icons/icon-08.svg"
                                      alt="placeholder"
                                      width={48}
                                      height={48}
                                      className="h-full w-full text-slate-400"
                                    />
                                  </div>
                                )}
                                {/* Subtle hover overlay backdrop */}
                                <div className="pointer-events-none absolute inset-0 rounded-full bg-slate-950/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                                {/* Edit button revealed only on hover */}
                                <div className="pointer-events-none absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 p-1 shadow-md backdrop-blur-xs opacity-0 scale-90 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100">
                                  <svg
                                    aria-hidden="true"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3 w-3 text-slate-900"
                                  >
                                    <path
                                      d="M4.333 12.667v2.5h2.5l7.5-7.5-2.5-2.5-7.5 7.5Zm9.583-9.583c.208-.208.417-.417.625-.417.208 0 .417.209.625.417l1.417 1.417c.208.208.417.417.417.625 0 .208-.209.417-.417.625l-1.25 1.25-2.5-2.5 1.25-1.25Z"
                                      fill="currentColor"
                                    />
                                  </svg>
                                </div>
                              </div>
                              <input {...inputProps} ref={inputRef} className="hidden" />
                            </>
                          );
                        }}
                    />
                  </div>
                    {isImageModalOpen ? (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6">
                        <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                          <button
                            type="button"
                            className="absolute right-4 top-4 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                            onClick={() => setImageModalOpen(false)}
                            aria-label="Close"
                          >
                            <span className="sr-only">Close modal</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5"
                              viewBox="0 0 14 14"
                              fill="none"
                            >
                              <path
                                d="M1 1l12 12m0-12L1 13"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-slate-900">Profile image</p>
                          </div>
                          <div className="mb-5 rounded-2xl bg-slate-50 p-4">
                            {profileImage?.path || user?.profilePicture ? (
                              <div className="flex h-72 w-72 items-center justify-center rounded-full bg-white">
                                <img
                                  src={profileImage?.path || user?.profilePicture}
                                  alt="Preview"
                                  className="h-full w-full rounded-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex h-72 w-72 items-center justify-center rounded-full bg-white text-sm text-slate-500">
                                No image uploaded yet
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setImageModalOpen(false);
                                fileInputRef.current?.click();
                              }}
                              className="rounded-full border border-blue px-4 py-2 text-sm font-semibold text-blue transition hover:bg-blue/10"
                            >
                              Upload image
                            </button>
                            <button
                              type="button"
                              disabled={!profileImage?.id && !user?.profilePicture}
                              onClick={handleRemoveProfileImage}
                              className="rounded-full border border-red px-4 py-2 text-sm font-semibold text-red transition hover:bg-red/10 disabled:opacity-50 disabled:hover:bg-transparent"
                            >
                              Remove image
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}

                  <div>
                    <p className="font-medium text-dark mb-0.5">
                      {user.name}
                    </p>
                    <p className="text-custom-xs">Member Since {getMemberSince(user.createdAt)}</p>
                    <Popconfirm title="Logout ?" okType="primary" okButtonProps={{className: "bg-blue text-white"}} onConfirm={logout}>
                    <Button
                      className={`flex items-center rounded-md gap-1 py-1 px-2 ease-out duration-200 bg-red text-white hover:bg-dark hover:text-white ${
                        activeTab === "logout"
                          ? "text-white bg-blue"
                          : "text-dark-2 bg-gray-1"
                      }`}
                    >
                      <svg
                        className="fill-current"
                        width="22"
                        height="22"
                        viewBox="0 0 22 22"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M13.7005 1.14581C12.4469 1.14579 11.4365 1.14578 10.6417 1.25263C9.81664 1.36356 9.12193 1.60088 8.57017 2.15263C8.08898 2.63382 7.84585 3.22514 7.71822 3.91997C7.59419 4.59515 7.57047 5.42142 7.56495 6.41282C7.56284 6.79251 7.86892 7.10202 8.24861 7.10414C8.6283 7.10625 8.93782 6.80016 8.93993 6.42047C8.94551 5.4181 8.97154 4.70761 9.07059 4.16838C9.16603 3.64881 9.31927 3.34807 9.54244 3.12491C9.79614 2.87121 10.1523 2.7058 10.825 2.61537C11.5174 2.52227 12.435 2.52081 13.7508 2.52081H14.6675C15.9833 2.52081 16.901 2.52227 17.5934 2.61537C18.266 2.7058 18.6222 2.87121 18.8759 3.12491C19.1296 3.37861 19.295 3.7348 19.3855 4.40742C19.4786 5.09983 19.48 6.01752 19.48 7.33331V14.6666C19.48 15.9824 19.4786 16.9001 19.3855 17.5925C19.295 18.2652 19.1296 18.6214 18.8759 18.8751C18.6222 19.1288 18.266 19.2942 17.5934 19.3846C16.901 19.4777 15.9833 19.4791 14.6675 19.4791H13.7508C12.435 19.4791 11.5174 19.4777 10.825 19.3846C10.1523 19.2942 9.79614 19.1288 9.54244 18.8751C9.31927 18.6519 9.16603 18.3512 9.07059 17.8316C8.97154 17.2924 8.94551 16.5819 8.93993 15.5795C8.93782 15.1998 8.6283 14.8937 8.24861 14.8958C7.86892 14.8979 7.56284 15.2075 7.56495 15.5871C7.57047 16.5785 7.59419 17.4048 7.71822 18.08C7.84585 18.7748 8.08898 19.3661 8.57017 19.8473C9.12193 20.3991 9.81664 20.6364 10.6417 20.7473C11.4365 20.8542 12.4469 20.8542 13.7006 20.8541H14.7178C15.9714 20.8542 16.9819 20.8542 17.7766 20.7473C18.6017 20.6364 19.2964 20.3991 19.8482 19.8473C20.4 19.2956 20.6373 18.6009 20.7482 17.7758C20.855 16.981 20.855 15.9706 20.855 14.7169V7.28302C20.855 6.02939 20.855 5.01893 20.7482 4.22421C20.6373 3.39911 20.4 2.70439 19.8482 2.15263C19.2964 1.60088 18.6017 1.36356 17.7766 1.25263C16.9819 1.14578 15.9714 1.14579 14.7178 1.14581H13.7005Z"
                          fill=""
                        />
                        <path
                          d="M13.7507 10.3125C14.1303 10.3125 14.4382 10.6203 14.4382 11C14.4382 11.3797 14.1303 11.6875 13.7507 11.6875H3.69247L5.48974 13.228C5.77802 13.4751 5.81141 13.9091 5.56431 14.1974C5.3172 14.4857 4.88318 14.5191 4.5949 14.272L1.38657 11.522C1.23418 11.3914 1.14648 11.2007 1.14648 11C1.14648 10.7993 1.23418 10.6086 1.38657 10.478L4.5949 7.72799C4.88318 7.48089 5.3172 7.51428 5.56431 7.80256C5.81141 8.09085 5.77802 8.52487 5.48974 8.77197L3.69247 10.3125H13.7507Z"
                          fill=""
                        />
                      </svg>
                      Logout
                    </Button>
                    </Popconfirm>
                  </div>

                  
                </div>

                <div className="p-4 sm:p-7.5 xl:p-8">
                  
                  <div className="w-full overflow-x-auto">
                    <div className="inline-flex min-w-full rounded-lg bg-gray-1/80 p-1.5 gap-1.5">
                      {tabs.map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={`whitespace-nowrap rounded-md py-2.5 px-4 text-sm font-medium ease-out duration-200 ${
                            activeTab === tab.key
                              ? "bg-blue text-white shadow-sm"
                              : "text-dark-2 hover:bg-white"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* <!--== user dashboard menu end ==-->

            
          <!--== user dashboard content start ==--> */}
            {/* <!-- addresses tab content start --> */}
            <div
              className={`w-full ${
                activeTab === "addresses" ? "block" : "hidden"
              }`}
            >
              <Addresses />
            </div>
            <div
              className={`w-full ${
                activeTab === "account-details" ? "block" : "hidden"
              } flex justify-center`}
            >
              <form onSubmit={handleProfileUpdate} className="w-full md:w-1/2">
                <div className="form-card p-4 sm:p-8.5">
                <div className="flex flex-col lg:flex-row gap-5 sm:gap-8 mb-5">
                  <div className="w-full">
                      <label htmlFor="email" className="form-label">
                        Email
                      </label>

                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={user?.email || ""}
                        disabled
                        readOnly
                        className="form-input bg-gray-2 text-dark-4 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-5 sm:gap-8 mb-5">
                    <div className="w-full">
                      <label htmlFor="firstName" className="form-label">
                        Name <span className="text-red">*</span>
                      </label>

                      <input
                        type="text"
                        name="name"
                        id="name"
                        placeholder="Enter Name"
                        defaultValue={user?.name}
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-5 sm:gap-8 mb-5">
                    <div className="w-full">
                      <label htmlFor="firstName" className="form-label">
                        Mobile <span className="text-red">*</span>
                      </label>

                      <input
                        type="number"
                        name="mobile"
                        id="name"
                        placeholder="Enter Mobile"
                        defaultValue={user?.mobile}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Save Changes
                  </button>
                </div>

                <p className="text-custom-sm mt-5 mb-9">
                  This will be how your name will be displayed in the account
                  section and in reviews
                </p>
              </form>
            </div>
            <div
              className={`w-full ${
                activeTab === "reset-password" ? "block" : "hidden"
              }`}
            >
              <ResetPassword email={user.email} nestedForm />

            </div>
            {/* <!-- details tab content end -->
          <!--== user dashboard content end ==--> */}
          </div>
        </div>
      </section>
    </>
  );
};

export default MyAccount;
