export interface Credit {
  name: string;
  reason: string;
  url?: string;
}

// Add new contributors here; the About dialog renders this list in order.
export const CREDITS: Credit[] = [
  { name: "Dice", reason: "for their original skills map" },
  { name: "Joel V.", reason: "for the idea to create something similar" },
  {
    name: "NIST",
    reason: "for the NICE Framework",
    url: "https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center",
  },
  { name: "Megan P.", reason: "for learning enough to build it" },
  { name: "Thomas G.", reason: "for providing feedback" },
  { name: "Kacie W.", reason: "for providing feedback" },
  { name: "Britt K.", reason: "for providing feedback" },
];
