import Error from 'src/components/Icons/Error';

export default function Custom500() {
  return (
    <div className="h-screen w-screen flex justify-center items-center">
      <div className="flex items-center flex-col">
        <Warning />
        <p className="pt-2 font-semibold">
          An Error Occurred
        </p>
      </div>
    </div>
  );
}
