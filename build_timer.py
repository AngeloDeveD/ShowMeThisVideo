import subprocess
import time
import sys

def main():
    command = ["npm", "run", "build-electron"]

    print("🚀 Starting build...\n")
    start = time.time()

    try:
        # Запускаем процесс и выводим всё в реальном времени
        process = subprocess.Popen(
            "npm run build-electron",
            shell=True
        )
        process.wait()

        if process.returncode != 0:
            print(f"\n❌ Build failed with exit code {process.returncode}")
            sys.exit(process.returncode)

    except KeyboardInterrupt:
        print("\n⚠️ Build interrupted by user.")
        sys.exit(1)

    end = time.time()
    duration = end - start

    mins, secs = divmod(duration, 60)
    print(f"\n✅ Build completed in {mins:.0f} min {secs:.2f} sec ({duration:.2f} seconds total)")

if __name__ == "__main__":
    main()
