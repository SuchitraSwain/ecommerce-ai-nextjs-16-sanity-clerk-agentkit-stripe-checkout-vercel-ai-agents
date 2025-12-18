import { defineField, defineType } from "sanity";
import { CogIcon } from "@sanity/icons";

export const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  icon: CogIcon,
  fields: [
    defineField({
      name: "storeName",
      type: "string",
      validation: (rule) => [
        rule.required().error("Store name is required"),
      ],
    }),
    defineField({
      name: "tagline",
      type: "string",
      description: "Short tagline or slogan for the store",
    }),
  ],
  preview: {
    select: {
      title: "storeName",
      subtitle: "tagline",
    },
  },
});
