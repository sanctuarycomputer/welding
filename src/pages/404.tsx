import NotFound from "src/components/Icons/NotFound";

export default function Custom404() {
  return (
    <div className="h-screen w-screen flex justify-center items-center">
      <div className="flex items-center flex-col">
        <NotFound />
        <p className="pt-2 font-semibold">Not Found</p>
      </div>
    </div>
  );
}
