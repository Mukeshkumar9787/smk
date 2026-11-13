"use client";
import React from "react";
import { getConfig } from "@/http/apiCalls";
import { CONFIG_KEYS } from "@/utils/constants";

const Contact = () => {
  const [compInfo, setCompInfo] = React.useState({});

  const fetchConfig = React.useCallback(async () => {
    try {
      const { success, data } = await getConfig({ configs: [CONFIG_KEYS.COMP_INFO] });
      if (!success) return;

      setCompInfo(data?.[CONFIG_KEYS.COMP_INFO] ?? {});
    } catch (error) {
      console.error(error);
    }
  }, []);

  React.useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const contactCards = [
    {
      title: "Visit Us",
      value: compInfo?.address || "Address not available",
      href: null,
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4.25 8.51464C4.25 4.45264 7.77146 1.25 12 1.25C16.2285 1.25 19.75 4.45264 19.75 8.51464C19.75 12.3258 17.3871 16.8 13.5748 18.4292C12.574 18.8569 11.426 18.8569 10.4252 18.4292C6.61289 16.8 4.25 12.3258 4.25 8.51464ZM12 2.75C8.49655 2.75 5.75 5.38076 5.75 8.51464C5.75 11.843 7.85543 15.6998 11.0147 17.0499C11.639 17.3167 12.361 17.3167 12.9853 17.0499C16.1446 15.6998 18.25 11.843 18.25 8.51464C18.25 5.38076 15.5034 2.75 12 2.75ZM12 7.75C11.3096 7.75 10.75 8.30964 10.75 9C10.75 9.69036 11.3096 10.25 12 10.25C12.6904 10.25 13.25 9.69036 13.25 9C13.25 8.30964 12.6904 7.75 12 7.75ZM9.25 9C9.25 7.48122 10.4812 6.25 12 6.25C13.5188 6.25 14.75 7.48122 14.75 9C14.75 10.5188 13.5188 11.75 12 11.75C10.4812 11.75 9.25 10.5188 9.25 9ZM3.59541 14.9966C3.87344 15.3036 3.84992 15.7779 3.54288 16.0559C2.97519 16.57 2.75 17.0621 2.75 17.5C2.75 18.2637 3.47401 19.2048 5.23671 19.998C6.929 20.7596 9.31952 21.25 12 21.25C14.6805 21.25 17.071 20.7596 18.7633 19.998C20.526 19.2048 21.25 18.2637 21.25 17.5C21.25 17.0621 21.0248 16.57 20.4571 16.0559C20.1501 15.7779 20.1266 15.3036 20.4046 14.9966C20.6826 14.6895 21.1569 14.666 21.4639 14.9441C22.227 15.635 22.75 16.5011 22.75 17.5C22.75 19.2216 21.2354 20.5305 19.3788 21.3659C17.4518 22.2331 14.8424 22.75 12 22.75C9.15764 22.75 6.54815 22.2331 4.62116 21.3659C2.76457 20.5305 1.25 19.2216 1.25 17.5C1.25 16.5011 1.77305 15.635 2.53605 14.9441C2.84309 14.666 3.31738 14.6895 3.59541 14.9966Z"
            fill="currentColor"
          />
        </svg>
      ),
    },
    {
      title: "Call Us",
      value: compInfo?.mobile || "Phone not available",
      href: compInfo?.mobile ? `tel:${compInfo.mobile}` : null,
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4.7177 3.0919C5.94388 1.80096 7.9721 2.04283 8.98569 3.47641L10.2467 5.25989C11.0574 6.40656 10.9889 8.00073 10.0214 9.0194L9.7765 9.27719C9.77582 9.27897 9.7751 9.2809 9.77436 9.28299C9.76142 9.31935 9.7287 9.43513 9.7609 9.65489C9.82765 10.1104 10.1793 11.0361 11.607 12.5392C13.0391 14.0469 13.9078 14.4023 14.3103 14.4677C14.484 14.4959 14.5748 14.4714 14.6038 14.4612L15.0124 14.031C15.8862 13.111 17.2485 12.9298 18.347 13.5621L20.2575 14.6617C21.8904 15.6016 22.2705 17.9008 20.9655 19.2747L19.545 20.7703C19.1016 21.2371 18.497 21.6355 17.75 21.7092C15.9261 21.8893 11.701 21.6548 7.27161 16.9915C3.13844 12.64 2.35326 8.85513 2.25401 7.00591L2.92011 6.97016L2.25401 7.00591C2.20497 6.09224 2.61224 5.30855 3.1481 4.7444L4.7177 3.0919Z"
            fill="currentColor"
          />
        </svg>
      ),
    },
    {
      title: "Email Us",
      value: compInfo?.email || "Email not available",
      href: compInfo?.email ? `mailto:${compInfo.email}` : null,
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9.94358 3.25H14.0564C15.8942 3.24998 17.3498 3.24997 18.489 3.40314C19.6614 3.56076 20.6104 3.89288 21.3588 4.64124C22.1071 5.38961 22.4392 6.33856 22.5969 7.51098C22.75 8.65019 22.75 10.1058 22.75 11.9436V12.0564C22.75 13.8942 22.75 15.3498 22.5969 16.489C22.4392 17.6614 22.1071 18.6104 21.3588 19.3588C20.6104 20.1071 19.6614 20.4392 18.489 20.5969C17.3498 20.75 15.8942 20.75 14.0564 20.75H9.94359C8.10583 20.75 6.65019 20.75 5.51098 20.5969C4.33856 20.4392 3.38961 20.1071 2.64124 19.3588C1.89288 18.6104 1.56076 17.6614 1.40314 16.489C1.24997 15.3498 1.24998 13.8942 1.25 12.0564V11.9436C1.24998 10.1058 1.24997 8.65019 1.40314 7.51098C1.56076 6.33856 1.89288 5.38961 2.64124 4.64124C3.38961 3.89288 4.33856 3.56076 5.51098 3.40314C6.65019 3.24997 8.10582 3.24998 9.94358 3.25Z"
            fill="currentColor"
          />
        </svg>
      ),
    },
  ];

  return (
    <>
      <section className="page-section">
        <div className="mx-auto flex w-full max-w-[1170px] flex-col gap-8 px-4 sm:px-8 xl:px-0">
          <div className="overflow-hidden rounded-[34px] border border-sky-100 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_28%),linear-gradient(135deg,#ffffff_0%,#f7fbff_52%,#eef6ff_100%)] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8 xl:p-10">
            <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
              <div>
                <span className="inline-flex rounded-full border border-sky-100 bg-white/85 px-3 py-1 text-sm font-semibold text-sky-700 shadow-sm">
                  Let’s Talk
                </span>
                <h1 className="mt-4 max-w-[560px] text-3xl font-semibold tracking-tight text-dark sm:text-4xl xl:text-[44px] xl:leading-[1.05]">
                  Reach out for product questions, orders, or custom print requests.
                </h1>
                <p className="mt-4 max-w-[560px] text-base leading-7 text-dark-4">
                  Get in touch with the SMK team for quick assistance. We are available to help with catalog guidance, availability, and project-specific inquiries.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {compInfo?.mobile ? (
                    <a
                      href={`tel:${compInfo.mobile}`}
                      className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-blue px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)] transition hover:bg-blue-dark"
                    >
                      Call Now
                    </a>
                  ) : null}
                  {compInfo?.email ? (
                    <a
                      href={`mailto:${compInfo.email}`}
                      className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-dark shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                    >
                      Send Email
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                {contactCards.map((card) => {
                  const content = (
                    <div className="flex h-full gap-4 rounded-[26px] border border-white/80 bg-white/82 p-5 shadow-[0_16px_38px_rgba(15,23,42,0.06)] backdrop-blur">
                      <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                        {card.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {card.title}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-dark">
                          {card.value}
                        </p>
                      </div>
                    </div>
                  );

                  if (card.href) {
                    return (
                      <a key={card.title} href={card.href} className="block transition hover:-translate-y-0.5">
                        {content}
                      </a>
                    );
                  }

                  return <div key={card.title}>{content}</div>;
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="form-card">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                Why Contact Us
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-dark">
                Fast support with the details you actually need.
              </h2>
              <div className="mt-6 space-y-4">
                {[
                  "Product recommendations based on use case and finish.",
                  "Order support for availability, pricing, and shipping.",
                  "Direct contact for custom or bulk printing requirements.",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-[22px] border border-slate-200 bg-white/75 px-4 py-4 shadow-sm"
                  >
                    <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5 13L9 17L19 7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <p className="text-sm leading-6 text-dark">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
              <div className="border-b border-slate-200 bg-white/90 px-6 py-5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                  Location
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-dark">
                  Visit Our Workspace
                </h2>
              </div>
              <div className="h-[420px] w-full">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d606861.7374255045!2d76.52628908749591!3d11.14793662389917!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba907b0424d75b9%3A0x4750551698a91687!2sTiruppur%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1792996249754!5m2!1sen!2sin"
                  width="600"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  title="Google Maps - Tiruppur, Tamil Nadu"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;
