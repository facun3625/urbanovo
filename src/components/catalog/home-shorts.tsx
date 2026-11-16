import { getHomeShorts } from "@/lib/about";
import { youtubeId } from "@/lib/home-shorts";

// Bloque de videos verticales (YouTube Shorts) del Inicio. Una franja de
// color suave detrás del título que los videos "pisan" por la mitad. En
// celular los videos se deslizan de costado en vez de apilarse.
export async function HomeShortsSection({ tenantId }: { tenantId: string }) {
  const shorts = await getHomeShorts(tenantId);
  const ids = shorts.videos.map(youtubeId).filter((id): id is string => Boolean(id));
  if (!shorts.show || ids.length === 0) return null;

  return (
    <section className="relative overflow-hidden py-14 lg:py-20" aria-labelledby="home-shorts-title">
      <div className="absolute inset-x-0 top-0 h-[68%] bg-primary/10" aria-hidden />
      <div className="relative mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {(shorts.title || shorts.subtitle) && (
          <div className="mx-auto mb-10 max-w-2xl text-center lg:mb-14">
            {shorts.title && (
              <h2 id="home-shorts-title" className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-tight">
                {shorts.title}
              </h2>
            )}
            {shorts.subtitle && <p className="mt-3 text-lg text-muted-foreground">{shorts.subtitle}</p>}
          </div>
        )}
        <div className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 lg:gap-8">
          {ids.map((id) => (
            <div
              key={id}
              className="aspect-[9/16] w-[68vw] max-w-[260px] shrink-0 snap-center overflow-hidden rounded-xl bg-black shadow-lg sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.5rem)]"
            >
              <iframe
                src={`https://www.youtube.com/embed/${id}?rel=0&playsinline=1`}
                title="Video de YouTube"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="size-full border-0"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
