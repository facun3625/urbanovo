import { getHomeShorts } from "@/lib/about";
import { youtubeId } from "@/lib/home-shorts";
import { HomeShortsCarousel } from "./home-shorts-carousel";

// Bloque de videos verticales (YouTube Shorts) del Inicio. Una franja de
// color suave detrás del título que los videos "pisan" por la mitad. Con
// más de 4 videos pasa a ser un carrusel con flechas.
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
        <HomeShortsCarousel ids={ids} />
      </div>
    </section>
  );
}
