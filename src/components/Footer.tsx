const Footer = () => {
  return (
    <footer className="border-t border-border bg-background px-4 py-12 md:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <img src="/phsweb-logo.png" alt="PHSWEB Internet" className="mb-4 h-10" />
          <p className="max-w-sm text-sm text-muted-foreground">
            Fast, reliable fibre and fixed wireless internet for Awka and
            surrounding areas. Connecting Anambra, one home at a time.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Quick Links</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#plans" className="hover:text-foreground">Plans</a></li>
            <li><a href="#features" className="hover:text-foreground">Features</a></li>
            <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
            <li><a href="#contact" className="hover:text-foreground">Contact</a></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>+234 8</li>
            <li>
              <a
                href="https://wa.me/2348000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground">

                WhatsApp
              </a>
            </li>
            <li>Awka, Anambra State</li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-6xl border-t border-border pt-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} PHSWEB Internet. All rights reserved.
      </div>
    </footer>);

};

export default Footer;