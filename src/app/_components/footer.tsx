import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#333] px-4 py-8 text-[#f5f5f5] md:px-8">
      <div className="container mx-auto flex flex-col items-center justify-between md:flex-row">
        <p className="text-sm">
          &copy; 2024 sittr. All rights reserved. Favicon &copy; 2023{" "}
          <a href="https://x.com/home">Twemoji</a>.
        </p>
        <nav className="mt-4 flex items-center space-x-6 md:mt-0">
          <Link
            href="/privacy-policy"
            className="hover:underline"
            prefetch={false}
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms-of-service"
            className="hover:underline"
            prefetch={false}
          >
            Terms of Service
          </Link>
          <Link href="/contact" className="hover:underline" prefetch={false}>
            Contact Us
          </Link>
        </nav>
      </div>
    </footer>
  );
}
