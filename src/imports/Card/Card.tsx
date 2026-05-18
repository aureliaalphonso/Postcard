import imgRectangle2 from "./184099e36c4916c223dbd2f3c3a9346712ef834a.png";
import imgRectangle1 from "./7bdaf0ee133e793c32025551c88f8862d0bf3403.png";

export default function Card() {
  return (
    <div className="relative size-full" data-name="Card">
      <div className="absolute flex h-[247.748px] items-center justify-center left-0 top-0 w-[308.082px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "22" } as React.CSSProperties}>
        <div className="flex-none rotate-[-16.51deg]">
          <div className="h-[178.874px] relative rounded-[4px] shadow-[4px_4px_35px_0px_rgba(0,0,0,0.25)] w-[268.312px]">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[4px] size-full" src={imgRectangle2} />
          </div>
        </div>
      </div>
      <div className="absolute flex h-[178.874px] items-center justify-center left-[59.69px] top-[94px] w-[268.312px]">
        <div className="-scale-y-100 flex-none rotate-180">
          <div className="h-[178.874px] relative rounded-[4px] shadow-[4px_4px_35px_0px_rgba(0,0,0,0.25)] w-[268.312px]">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[4px] size-full" src={imgRectangle1} />
          </div>
        </div>
      </div>
    </div>
  );
}