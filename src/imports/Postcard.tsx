import imgA2C3F2681F43A7Ad4D7F53E4Eb68Ac1D2 from "figma:asset/a65a38d1c266086ab31552d1ae461254b75f9d6a.png";
import imgC1Cda94Ae5Ccd9F52388Bc01370770011 from "figma:asset/4413e91ca5c2c745bfddd176b708c998b839f504.png";

export default function Postcard() {
  return (
    <div className="relative size-full" data-name="POSTCARD">
      <div className="absolute left-0 size-[70px] top-0" data-name="a2c3f2681f43a7ad4d7f53e4eb68ac1d 2">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgA2C3F2681F43A7Ad4D7F53E4Eb68Ac1D2} />
      </div>
      <div className="absolute flex h-[45.086px] items-center justify-center left-[31px] top-[24px] w-[45.183px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "22" } as React.CSSProperties}>
        <div className="flex-none rotate-[56.09deg]">
          <div className="h-[32.701px] relative w-[32.343px]" data-name="c1cda94ae5ccd9f52388bc0137077001 1">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgC1Cda94Ae5Ccd9F52388Bc01370770011} />
          </div>
        </div>
      </div>
      <p className="absolute font-['Inria_Serif:Bold',sans-serif] leading-[normal] left-[52px] not-italic text-[36px] text-black top-[15px] whitespace-nowrap">POSTCARD</p>
    </div>
  );
}