"use client";

import React, { useRef, useEffect, useState } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import Link from "next/link";

const cn = (...classes: string[]) => classes.filter(Boolean).join(" ");

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Minimum 8 characters"),
});
type FormData = z.infer<typeof schema>;

// ─── DotMap canvas animation ────────────────────────────────────────────────

type RoutePoint = { x: number; y: number; delay: number };

const routes: { start: RoutePoint; end: RoutePoint; color: string }[] = [
  { start: { x: 100, y: 150, delay: 0 },   end: { x: 200, y: 80,  delay: 2 },   color: "#2563eb" },
  { start: { x: 200, y: 80,  delay: 2 },   end: { x: 260, y: 120, delay: 4 },   color: "#2563eb" },
  { start: { x: 50,  y: 50,  delay: 1 },   end: { x: 150, y: 180, delay: 3 },   color: "#2563eb" },
  { start: { x: 280, y: 60,  delay: 0.5 }, end: { x: 180, y: 180, delay: 2.5 }, color: "#2563eb" },
];

const DotMap = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const generateDots = (width: number, height: number) => {
    const dots: { x: number; y: number; radius: number; opacity: number }[] = [];
    const gap = 12;
    for (let x = 0; x < width; x += gap) {
      for (let y = 0; y < height; y += gap) {
        const inMap =
          ((x < width * 0.25 && x > width * 0.05) && (y < height * 0.4  && y > height * 0.1)) ||
          ((x < width * 0.25 && x > width * 0.15) && (y < height * 0.8  && y > height * 0.4)) ||
          ((x < width * 0.45 && x > width * 0.3)  && (y < height * 0.35 && y > height * 0.15)) ||
          ((x < width * 0.5  && x > width * 0.35) && (y < height * 0.65 && y > height * 0.35)) ||
          ((x < width * 0.7  && x > width * 0.45) && (y < height * 0.5  && y > height * 0.1)) ||
          ((x < width * 0.8  && x > width * 0.65) && (y < height * 0.8  && y > height * 0.6));
        if (inMap && Math.random() > 0.3)
          dots.push({ x, y, radius: 1, opacity: Math.random() * 0.5 + 0.2 });
      }
    }
    return dots;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
      canvas.width = width;
      canvas.height = height;
    });
    observer.observe(canvas.parentElement as Element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dots = generateDots(dimensions.width, dimensions.height);
    let rafId: number;
    let startTime = Date.now();

    const draw = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      dots.forEach((d) => {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(37, 99, 235, ${d.opacity})`;
        ctx.fill();
      });

      const t = (Date.now() - startTime) / 1000;
      routes.forEach((r) => {
        const elapsed = t - r.start.delay;
        if (elapsed <= 0) return;
        const progress = Math.min(elapsed / 3, 1);
        const x = r.start.x + (r.end.x - r.start.x) * progress;
        const y = r.start.y + (r.end.y - r.start.y) * progress;

        ctx.beginPath();
        ctx.moveTo(r.start.x, r.start.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(r.start.x, r.start.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = r.color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#3b82f6";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(59, 130, 246, 0.4)";
        ctx.fill();

        if (progress === 1) {
          ctx.beginPath();
          ctx.arc(r.end.x, r.end.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = r.color;
          ctx.fill();
        }
      });

      if (t > 15) startTime = Date.now();
      rafId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [dimensions]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

// ─── Main sign-in component ──────────────────────────────────────────────────

export const TravelConnectSignIn = () => {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await api.post("/auth/login", data);
      const meRes = await api.get("/auth/me");
      setAuth(meRes.data.data);
      router.push("/dashboard");
    } catch {
      setError("root", { message: "Invalid email or password" });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl overflow-hidden rounded-2xl flex bg-white shadow-xl"
      >
        {/* Left — animated dot map */}
        <div className="hidden md:block w-1/2 h-150 relative overflow-hidden border-r border-gray-100">
          <div className="absolute inset-0 bg-linear-to-br from-blue-50 to-indigo-100">
            <DotMap />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mb-6"
              >
                <div className="h-12 w-12 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                  <ArrowRight className="text-white h-6 w-6" />
                </div>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="text-3xl font-bold mb-2 text-center text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600"
              >
                Auth System
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="text-sm text-center text-gray-600 max-w-xs"
              >
                Sign in to access your secure workspace
              </motion.p>
            </div>
          </div>
        </div>

        {/* Right — form */}
        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold mb-1 text-gray-800">
              Welcome back
            </h1>
            <p className="text-gray-500 mb-8">Sign in to your account</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email <span className="text-blue-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="you@example.com"
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password <span className="text-blue-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={isPasswordVisible ? "text" : "password"}
                    {...register("password")}
                    placeholder="••••••••"
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 pr-10 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                    onClick={() => setIsPasswordVisible((v) => !v)}
                  >
                    {isPasswordVisible ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {errors.root && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-red-600 text-sm">{errors.root.message}</p>
                </div>
              )}

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                className="pt-2"
              >
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "w-full relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition-all duration-300 bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:pointer-events-none",
                    isHovered ? "shadow-lg shadow-blue-200" : ""
                  )}
                >
                  <span className="flex items-center justify-center">
                    {isSubmitting ? "Signing in..." : "Sign in"}
                    {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                  </span>
                  {isHovered && (
                    <motion.span
                      initial={{ left: "-100%" }}
                      animate={{ left: "100%" }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                      className="absolute top-0 bottom-0 left-0 w-20 bg-linear-to-r from-transparent via-white/30 to-transparent"
                      style={{ filter: "blur(8px)" }}
                    />
                  )}
                </button>
              </motion.div>

              <div className="flex items-center justify-between mt-4 text-sm">
                <Link
                  href="/register"
                  className="text-gray-500 hover:text-black transition"
                >
                  No account?{" "}
                  <span className="text-blue-600 font-medium underline">
                    Sign up
                  </span>
                </Link>
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-700 transition"
                >
                  Forgot password?
                </a>
              </div>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
