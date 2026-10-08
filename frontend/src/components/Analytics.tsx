"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useConsentState } from "@/lib/use-consent";
import { trackingConfig, trackPageView, updateConsentMode } from "@/lib/tracking";

export function Analytics() {
  const pathname = usePathname();
  const choice = useConsentState();
  const trackedPath = useRef<string | null>(null);
  const admin = pathname.startsWith("/admin");
  const consent = !admin && choice !== "pending" ? choice : null;

  useEffect(() => {
    if (!consent) return;
    updateConsentMode(consent);
  }, [consent]);

  useEffect(() => {
    if (!consent?.analytics && !consent?.marketing) return;
    if (trackedPath.current === null) {
      trackedPath.current = pathname;
      return;
    }
    if (trackedPath.current === pathname) return;
    trackedPath.current = pathname;
    trackPageView();
  }, [pathname, consent]);

  if (!consent) return null;

  const analyticsOn = consent.analytics;
  const marketingOn = consent.marketing;
  const containerOn = analyticsOn || marketingOn;
  const direct = !trackingConfig.tagsInGtm;
  const { gtmId, gaId, pixelId, clarityId } = trackingConfig;

  return (
    <>
      {gtmId && containerOn ? <GoogleTagManager id={gtmId} /> : null}
      {direct && gaId && analyticsOn ? <GoogleAnalytics id={gaId} /> : null}
      {direct && pixelId && marketingOn ? <MetaPixel id={pixelId} /> : null}
      {direct && clarityId && analyticsOn ? <MicrosoftClarity id={clarityId} /> : null}
    </>
  );
}

function GoogleTagManager({ id }: { id: string }) {
  return (
    <Script id="gtm" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${id}');`}
    </Script>
  );
}

function GoogleAnalytics({ id }: { id: string }) {
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {`window.gtag('js', new Date());
window.gtag('config', '${id}', { send_page_view: false });
window.gtag('event', 'page_view', {
  page_path: location.pathname + location.search,
  page_location: location.href,
  page_title: document.title
});`}
      </Script>
    </>
  );
}

function MetaPixel({ id }: { id: string }) {
  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${id}');
fbq('track', 'PageView');
(window.__rnPixel || []).splice(0).forEach(function(args){fbq.apply(null, args);});`}
    </Script>
  );
}

function MicrosoftClarity({ id }: { id: string }) {
  return (
    <Script id="clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${id}");`}
    </Script>
  );
}
