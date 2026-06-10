import Link from "next/link";
import Image from "next/image";
import { Star, Clock, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDuration } from "@/lib/utils";

export interface CourseCardData {
  slug: string;
  title: string;
  subtitle?: string | null;
  thumbnail?: string | null;
  price: number;
  discountPrice?: number | null;
  isFree: boolean;
  level: string;
  duration: number;
  category?: string | null;
  rating?: number;
  students?: number;
}

export function CourseCard({ course }: { course: CourseCardData }) {
  const price = course.discountPrice ?? course.price;
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            sizes="(max-width:768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
        )}
        {course.isFree && <Badge variant="success" className="absolute left-3 top-3">Free</Badge>}
        {!course.isFree && course.discountPrice && (
          <Badge variant="warning" className="absolute left-3 top-3">
            {Math.round((1 - course.discountPrice / course.price) * 100)}% off
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {course.category && <span className="text-xs font-medium text-primary">{course.category}</span>}
        <h3 className="mt-1 line-clamp-2 font-semibold leading-tight group-hover:text-primary">{course.title}</h3>
        {course.subtitle && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{course.subtitle}</p>}
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatDuration(course.duration || 0)}</span>
          <span className="inline-flex items-center gap-1 capitalize"><BarChart3 className="h-3.5 w-3.5" />{course.level.replace("_", " ").toLowerCase()}</span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-medium">{(course.rating ?? 4.7).toFixed(1)}</span>
          </div>
          <div className="text-right">
            {course.isFree ? (
              <span className="font-bold text-primary">Free</span>
            ) : (
              <div className="flex items-center gap-2">
                {course.discountPrice && (
                  <span className="text-xs text-muted-foreground line-through">{formatCurrency(course.price)}</span>
                )}
                <span className="font-bold">{formatCurrency(price)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
