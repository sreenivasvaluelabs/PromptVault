import { CategoryInfo } from "@/types/prompt";

export const categoryConfig: CategoryInfo[] = [
  {
    key: "foundation",
    name: "Foundation Layer",
    description: "Core services and infrastructure components",
    icon: "cog",
    count: 5
  },
  {
    key: "feature",
    name: "Feature Layer", 
    description: "Business logic and feature implementations",
    icon: "puzzle-piece",
    count: 5
  },
  {
    key: "project",
    name: "Project Layer",
    description: "Site-wide configurations and layouts",
    icon: "sitemap",
    count: 5
  },
  {
    key: "components",
    name: "UI Components",
    description: "Reusable user interface components",
    icon: "cubes",
    count: 5
  },
  {
    key: "testing",
    name: "Testing",
    description: "Testing frameworks and patterns",
    icon: "vial",
    count: 5
  },
  {
    key: "styling",
    name: "Styling",
    description: "CSS and styling components",
    icon: "paint-brush",
    count: 1
  },
  {
    key: "sdlc_templates",
    name: "SDLC Templates",
    description: "Software development lifecycle templates",
    icon: "project-diagram",
    count: 13
  }
];

export const cognizantColors = {
  primary: "#0066CC",
  darkBlue: "#004B9F", 
  lightBlue: "#E6F2FF",
  white: "#FFFFFF",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray600: "#4B5563",
  gray900: "#111827"
};
