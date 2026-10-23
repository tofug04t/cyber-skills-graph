export const FEEDBACK_URL = "https://forms.gle/EPC65MYimKe3G7Dc6";

export interface Credit {
  name: string;
  reason: string;
  /** Links one phrase inside `reason`. */
  link?: { text: string; url: string };
}

// Add new contributors here; the About dialog renders this list in order.
export const CREDITS: Credit[] = [
  { name: "Dice", reason: "for their original skills map" },
  { name: "Joel", reason: "for the idea to create something similar" },
  {
    name: "NIST",
    reason: "for the NICE Framework",
    link: {
      text: "NICE Framework",
      url: "https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center",
    },
  },
  { name: "tofug04t", reason: "for learning enough to build it" },
  { name: "Thomas, Kacie, and Britt", reason: "for providing feedback" },
];
