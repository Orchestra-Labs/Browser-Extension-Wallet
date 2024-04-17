import React from 'react';

export const UniswapLogo: React.FC<React.SVGProps<SVGSVGElement>> = props => (
  <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <mask id="uniswapMask" fill="#fff">
      <path d="M49.246 31.048C45.907 44.44 32.343 52.59 18.948 49.252 5.559 45.912-2.592 32.347.748 18.955 4.087 5.561 17.652-2.591 31.042.748c13.394 3.34 21.544 16.906 18.205 30.3Z" />
    </mask>
    <path
      d="M49.246 31.048C45.907 44.44 32.343 52.59 18.948 49.252 5.559 45.912-2.592 32.347.748 18.955 4.087 5.561 17.652-2.591 31.042.748c13.394 3.34 21.544 16.906 18.205 30.3Z"
      fill="url(#uniswapGradient)"
    />
    <path
      d="m49.246 31.048 3.882.967 1.238-4.967h-5.12v4ZM18.948 49.252l-.968 3.88.968-3.88ZM.748 18.955l3.882.968-3.881-.968ZM31.042.748l-.967 3.881.967-3.88Zm18.205 30.3-3.881-.968-3.49 13.995 10.2-10.199-2.829-2.828Zm0 0v-4H47.59l-1.171 1.171 2.828 2.829Zm-3.88-.968c-2.805 11.25-14.2 18.096-25.45 15.29l-1.936 7.763c15.538 3.874 31.274-5.581 35.148-21.118l-7.763-1.935Zm-25.45 15.29C8.67 42.566 1.824 31.172 4.63 19.924l-7.762-1.936c-3.875 15.535 5.58 31.272 21.112 35.146l1.936-7.763ZM4.63 19.922C7.433 8.672 18.827 1.825 30.074 4.63l1.935-7.762C16.475-7.007.74 2.45-3.133 17.987l7.763 1.935ZM30.074 4.63c11.25 2.805 18.096 14.2 15.29 25.451l7.763 1.936C57.001 16.479 47.547.74 32.01-3.134L30.074 4.63Zm22 29.247-5.656-5.657 5.657 5.657Zm-2.828 1.172v-8 8Z"
      fill="#FFD9EC"
      mask="url(#uniswapMask)"
    />
    <path
      d="M21.054 15.44c-.338-.048-.354-.064-.193-.08.306-.048 1.015.016 1.515.13 1.16.273 2.208.982 3.32 2.223l.29.339.419-.065c1.789-.29 3.626-.064 5.157.645.42.193 1.08.58 1.16.677.033.032.081.241.114.451.112.757.064 1.322-.178 1.757-.129.241-.129.306-.048.515.064.162.258.274.435.274.387 0 .79-.612.983-1.466l.08-.339.146.162c.822.918 1.466 2.191 1.563 3.094l.032.242-.145-.21c-.242-.37-.467-.612-.773-.822-.548-.37-1.128-.483-2.66-.564-1.386-.08-2.175-.193-2.949-.451-1.322-.435-1.998-1-3.562-3.078-.693-.92-1.128-1.419-1.563-1.838-.95-.918-1.902-1.402-3.143-1.595Z"
      fill="#FF007A"
    />
    <path
      d="M33.061 17.488c.032-.613.113-1.016.29-1.386.065-.146.13-.274.145-.274.016 0-.016.112-.064.241-.13.355-.145.855-.065 1.419.113.725.162.822.935 1.611.355.37.774.838.935 1.032l.274.354-.274-.258c-.339-.322-1.112-.934-1.29-1.015-.112-.064-.128-.064-.209.016-.065.065-.08.161-.08.629-.017.725-.113 1.176-.355 1.644-.13.241-.145.193-.032-.081.08-.21.096-.306.096-1 0-1.401-.16-1.74-1.144-2.304-.242-.145-.66-.354-.902-.467-.258-.113-.452-.21-.436-.21.033-.032.983.242 1.354.403.564.226.66.242.725.226.049-.049.081-.178.097-.58ZM21.715 19.889c-.677-.935-1.112-2.385-1.015-3.465l.032-.339.161.033c.29.048.79.241 1.032.387.644.386.934.918 1.208 2.24.08.386.194.838.242.983.08.241.387.806.645 1.16.177.258.064.387-.339.355-.612-.065-1.434-.629-1.966-1.354ZM32.24 26.9c-3.192-1.29-4.32-2.402-4.32-4.287 0-.274.016-.5.016-.5.016 0 .129.097.274.21.645.515 1.37.74 3.384 1.031 1.177.177 1.854.306 2.466.516 1.95.644 3.16 1.966 3.45 3.755.08.516.032 1.499-.097 2.015-.113.402-.436 1.144-.516 1.16-.016 0-.048-.08-.048-.21-.033-.677-.371-1.321-.935-1.82-.677-.581-1.547-1.016-3.675-1.87ZM29.983 27.431a3.826 3.826 0 0 0-.161-.676l-.08-.242.144.177c.21.242.37.532.516.935.113.306.113.403.113.902 0 .484-.016.597-.113.87a2.918 2.918 0 0 1-.677 1.08c-.58.597-1.338.92-2.418 1.064-.193.016-.74.065-1.224.097-1.21.064-2.015.193-2.74.451-.097.032-.194.065-.21.049-.032-.033.468-.323.87-.516.565-.274 1.145-.42 2.418-.645.629-.097 1.273-.226 1.434-.29 1.596-.5 2.386-1.74 2.128-3.256Z"
      fill="#FF007A"
    />
    <path
      d="M31.45 30.026c-.42-.918-.516-1.789-.29-2.61.032-.081.064-.162.096-.162s.129.049.226.113c.193.129.596.355 1.627.919 1.306.709 2.047 1.257 2.563 1.885.451.548.725 1.177.854 1.95.08.436.032 1.483-.08 1.918-.355 1.37-1.16 2.466-2.337 3.095a2.237 2.237 0 0 1-.339.16c-.016 0 .049-.16.145-.354.387-.822.435-1.611.145-2.498-.177-.548-.548-1.209-1.289-2.32-.886-1.29-1.096-1.628-1.322-2.096ZM19.443 34.958c1.192-1 2.659-1.708 4.013-1.934.58-.097 1.547-.065 2.079.08.854.226 1.627.71 2.03 1.306.387.58.564 1.08.742 2.192.064.435.145.886.16.983.13.58.388 1.031.71 1.273.5.37 1.37.387 2.224.065.145-.049.274-.097.274-.081.032.032-.403.322-.693.467-.403.21-.725.274-1.16.274-.774 0-1.435-.402-1.967-1.208-.112-.161-.338-.629-.531-1.064-.565-1.306-.855-1.692-1.515-2.127-.58-.371-1.322-.452-1.886-.178-.741.355-.935 1.306-.42 1.886.21.242.597.435.92.483a.983.983 0 0 0 1.112-.983c0-.387-.145-.612-.532-.79-.516-.225-1.08.033-1.064.533 0 .209.097.338.306.435.13.064.13.064.032.048-.467-.097-.58-.677-.209-1.048.451-.45 1.402-.258 1.724.371.13.258.145.774.033 1.096-.274.71-1.048 1.08-1.838.87-.531-.145-.757-.29-1.402-.95-1.128-1.161-1.563-1.387-3.175-1.628l-.306-.049.339-.322Z"
      fill="#FF007A"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.965 9.026c3.755 4.561 9.541 11.653 9.831 12.04.242.322.146.628-.258.854-.225.129-.692.257-.918.257-.258 0-.564-.128-.774-.338-.145-.145-.773-1.064-2.192-3.272a209.015 209.015 0 0 0-2.014-3.11c-.065-.032-.065-.032 1.902 3.481 1.24 2.208 1.643 2.998 1.643 3.094 0 .21-.064.323-.322.613-.435.483-.628 1.031-.773 2.176-.162 1.273-.597 2.175-1.838 3.706-.725.903-.838 1.064-1.015 1.435-.226.451-.29.709-.322 1.29-.033.611.032.998.21 1.579.16.515.338.854.773 1.514.37.58.596 1.016.596 1.177 0 .129.032.129.613 0 1.386-.322 2.53-.87 3.158-1.547.387-.42.484-.645.484-1.225 0-.37-.016-.451-.113-.677-.161-.355-.467-.645-1.128-1.096-.87-.596-1.241-1.08-1.338-1.724-.08-.548.016-.919.5-1.934.5-1.048.628-1.483.709-2.547.048-.677.129-.95.322-1.16.21-.226.387-.306.887-.37.822-.114 1.354-.323 1.772-.726.371-.338.532-.677.548-1.177l.017-.37-.21-.226c-.757-.87-11.25-12.41-11.298-12.41-.016 0 .242.307.548.693Zm4.948 22.918a.665.665 0 0 0-.21-.886c-.273-.178-.692-.097-.692.145 0 .064.032.129.129.16.144.082.16.162.048.34-.113.177-.113.338.032.45.226.178.532.081.693-.209ZM22.44 23.467c-.387.113-.757.532-.87.95-.064.259-.032.726.08.871.178.226.339.29.79.29.887 0 1.644-.387 1.725-.854.08-.387-.258-.919-.726-1.16-.241-.13-.74-.178-.999-.097Zm1.032.806c.129-.194.08-.403-.161-.548-.436-.274-1.096-.049-1.096.37 0 .21.338.436.66.436.21 0 .5-.13.597-.258Z"
      fill="#FF007A"
    />
    <defs>
      <linearGradient
        id="uniswapGradient"
        x1="0"
        y1="0"
        x2="0"
        y2="50"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#FEF3F9" />
        <stop offset="1" stopColor="#FDE5F2" />
      </linearGradient>
    </defs>
  </svg>
);
