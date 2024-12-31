import Link from "next/link";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

const TOS = () => {
  return (
    <main className="mx-auto max-w-xl">
      <div className="p-5">
        <h1 className="pb-6 text-3xl font-extrabold">
          Terms and Conditions for sittr
        </h1>

        <pre
          className="whitespace-pre-wrap leading-relaxed"
          style={{ fontFamily: "sans-serif" }}
        >
          {`Last Updated: December 31st, 2024
  
  Welcome to sittr.
  
  These Terms of Service ("Terms") govern your use of the sittr website at https://sittr.pet ("Website") and the services provided by sittr. By using our Website and services, you agree to these Terms.
  
  1. Description of sittr
  
  sittr is a platform that allows users to organise their trusted friends and family to help with sitting their pets, houses or anything else. Users create tasks which are sent to their trusted network invited by the user.
  
  2. Ownership and Usage Rights
  
  All content, features, and functionality of the app, including but not limited to text, graphics, logos, images, and software (collectively referred to as "App Content"), are the exclusive property of sittr or its licensors. The App Content is protected by copyright, trademark, and other intellectual property laws.
  
  Users retain ownership of any content they create and upload to the app, including pet profiles, reviews, and photographs (collectively referred to as "User Content"). By submitting User Content, you grant sittr a non-exclusive, royalty-free, worldwide license to use, reproduce, modify, publish, and distribute such content for the purposes of operating and promoting the app. 
  
  Users are prohibited from using the app for purposes other than those intended by sittr.

  Users are prohibited from deleberately submitting excessive requests to the sittr servers, or attempting to disrupt the app's functionality in any way.

  sittr reserves the right to terminate or suspend any user's access to the app if they violate these terms or engage in any unauthorised use of the App Content.

  sittr is not responsible for how users interact outside of the app and is not responsible for any damages or disputes that may arise from these interactions.
  
  We offer a full refund within 14 days of purchase, as specified in our refund policy.
  
  3. User Data and Privacy
  
  We collect and store user data, including name, email, and payment information, as necessary to provide our services. For details on how we handle your data, please refer to our Privacy Policy at https://sittr.uk/privacy-policy.

  You can request that your data be deleted via the settings page, or by contacting us at zbenattar@gmail.com.

  To request a copy of your data or to report a data breach, please contact us at zbenattar@gmail.com.
  
  4. Non-Personal Data Collection
  
  We use web cookies to collect non-personal data for the purpose of improving our services and user experience.
  
  5. Governing Law
  
  These Terms are governed by the laws of The United Kingdom.
  
  6. Updates to the Terms
  
  We may update these Terms from time to time. Users will be notified of any changes via email.
  
  For any questions or concerns regarding these Terms of Service, please contact us at zac@mail.sittr.uk
  
  Thank you for using sittr.`}
        </pre>
      </div>
    </main>
  );
};

export default TOS;
