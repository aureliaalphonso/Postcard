import imgClippedImage202605132217142 from "./38cf50efd085002266c78f3a97c9adf359c3778f.png";

function Sticker() {
  return (
    <div className="absolute contents left-0 top-0" data-name="Sticker">
      <div className="absolute h-[180.889px] left-0 top-0 w-[148.538px]" data-name="Clipped_image_20260513_221714 2">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgClippedImage202605132217142} />
      </div>
    </div>
  );
}

export default function Group() {
  return (
    <div className="relative size-full">
      <div className="absolute h-[146px] left-[17px] top-[17px] w-[115px]">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 115 146">
          <ellipse cx="57.5" cy="73" fill="var(--fill-0, #D9D9D9)" id="Ellipse 9" rx="57.5" ry="73" />
        </svg>
      </div>
      <Sticker />
    </div>
  );
}