import Link from "next/link";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

const PrivacyPolicy = () => {
  return (
    <main className="mx-auto max-w-xl">
      <div className="p-5">
        <h1 className="pb-6 text-3xl font-extrabold">
          Privacy Policy for sittr
        </h1>

        <pre
          className="whitespace-pre-wrap leading-relaxed"
          style={{ fontFamily: "sans-serif" }}
        >
          {`Last Updated: December 31th, 2024
  
  Thank you for visiting sittr ("we," "us," or "our"). This Privacy Policy outlines how we collect, use, and protect your personal and non-personal information when you use our website located at https://sittr.uk (the "Website").
  
  By accessing or using the Website, you agree to the terms of this Privacy Policy. If you do not agree with the practices described in this policy, please do not use the Website.
  
  1. Information We Collect
  
  1.1 Personal Data
  
  We collect the following personal information from you:
  
  Name: We collect your name to personalize your experience and communicate with you effectively.
  Email: We collect your email address to send you important information regarding your orders, updates, and communication.
  Payment Information: We collect payment details to process your orders securely. However, we do not store your payment information on our servers. Payments are processed by trusted third-party payment processors.
  User Generated Content: Text, images, and other content that you voluntarily submit to the Website. This may be related to your pets, houses, plants or other property.

  1.2 Non-Personal Data
  
  We may use web cookies and similar technologies to collect non-personal information such as your IP address, browser type, device information, and browsing patterns. This information helps us to enhance your browsing experience, analyze trends, and improve our services.
  
  2. Purpose of Data Collection
  
  We collect and use your personal data for the purposes of order processing and to provide the service. This includes processing your orders, sending order confirmations, providing customer support, and keeping you updated about the status of your orders.
  
  3. Data Sharing
  
  We do not share your personal data with any third parties except as required for order processing (e.g., sharing your information with payment processors). We do not sell, trade, or rent your personal information to others.
  
  4. Children's Privacy
  
  sittr is not intended for children under the age of 13. We do not knowingly collect personal information from children. If you are a parent or guardian and believe that your child has provided us with personal information, please contact us at the email address provided below.
  
  5. Updates to the Privacy Policy
  
  We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. Any updates will be posted on this page, and we may notify you via email about significant changes.
  
  6. Contact Information
  
  If you have any questions, concerns, or requests related to this Privacy Policy, you can contact us at:
  
  Email: zbenattar@gmail.com
  
  For all other inquiries, please visit our Contact Us page on the Website.
  
  By using sittr, you consent to the terms of this Privacy Policy.`}
        </pre>
      </div>
    </main>
  );
};

export default PrivacyPolicy;
