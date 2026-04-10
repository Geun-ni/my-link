import { dummyLinks } from "@/data/links";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { RiLinksLine, RiArrowRightSLine } from "@remixicon/react";

function getFaviconUrl(url: string) {
  try {
    const domain = new URL(url).hostname;
    return `https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return null;
  }
}

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center py-24 px-6 bg-gradient-to-b from-slate-50 to-slate-200 dark:from-slate-950 dark:to-slate-900 selection:bg-slate-300 dark:selection:bg-slate-700">
      <div className="w-full max-w-[420px] flex flex-col items-center gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Profile Section */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="group relative flex h-28 w-28 items-center justify-center rounded-full shadow-md ring-4 ring-white dark:ring-slate-800 transition-transform duration-300 hover:scale-105 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://github.com/Geun-ni.png"
              alt="Github Profile"
              className="h-full w-full rounded-full object-cover"
            />
          </div>
          <div className="space-y-1.5 mt-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              @Geun-ni
            </h1>
            <a href="mailto:wjdrms279836@gmail.com" className="block text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
              wjdrms279836@gmail.com
            </a>
          </div>
        </div>

        {/* Links Section */}
        <div className="w-full flex flex-col gap-4">
          {dummyLinks.map((link) => {
            const faviconUrl = getFaviconUrl(link.url);

            return (
              <Link
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 rounded-[1.25rem] group"
              >
                <Card className="border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-none dark:hover:bg-slate-800 transition-all duration-300 ease-out group-hover:-translate-y-1 rounded-[1.25rem] overflow-hidden ring-1 ring-black/5 dark:ring-white/10 relative">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 z-10">
                      {faviconUrl ? (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700/50 shadow-sm border border-slate-200/50 dark:border-slate-600/50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={faviconUrl}
                            alt={`${link.title} icon`}
                            className="h-6 w-6 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700/50 shadow-sm border border-slate-200/50 dark:border-slate-600/50">
                          <RiLinksLine className="h-6 w-6 text-slate-500" />
                        </div>
                      )}
                      <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100 group-hover:text-black dark:group-hover:text-white transition-colors">
                        {link.title}
                      </CardTitle>
                    </div>
                    {/* Hover Arrow Indicator */}
                    <div className="bg-slate-100 dark:bg-slate-700/50 p-1.5 rounded-full opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                      <RiArrowRightSLine className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
