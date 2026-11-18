import { Category } from "@/types/category";
import Link from "next/link";
import React from "react";

interface SingleItemProps {
  item: Category;
  href: string;
}

const SingleItem = ({ item, href }: SingleItemProps) => {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col text-center transition duration-300 hover:-translate-y-1"
    >
      <div className="flex min-h-[165px] items-center justify-center overflow-hidden">
        <img
          src={item.img}
          alt={`${item.title} category`}
          width={108}
          height={88}
          loading="lazy"
          className="max-h-[118px] object-contain transition duration-300 group-hover:scale-105"
        />
      </div>

      <div className="mt-1">
        <h3 className="text-base font-semibold tracking-tight text-dark transition duration-300 group-hover:text-sky-700">
          {item.title}
        </h3>
      </div>
    </Link>
  );
};

export default SingleItem;
