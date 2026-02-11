/** Logo from public folder (for login/signup). */
export function SwpLogo() {
  return (
    <div className="mx-auto flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
      <img
        src="/mvplogo.jpg"
        alt="Logo"
        className="h-full w-full object-cover"
      />
    </div>
  );
}
