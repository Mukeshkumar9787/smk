import React from "react";
import Categories from "./Categories";
import NewArrival from "./NewArrivals";
import type { SeoCategoryData } from "@/lib/seoServer";

interface HomeProps {
  initialCategories?: SeoCategoryData[];
}

const Home = ({ initialCategories = [] }: HomeProps) => {
  return (
    <div className="overflow-hidden bg-transparent">
      <NewArrival />
      <Categories initialCategories={initialCategories} />
    </div>
  );
};

export default Home;
