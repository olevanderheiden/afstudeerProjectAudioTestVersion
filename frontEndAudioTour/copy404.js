import { copyFileSync } from "fs";

try {
  // Copy index.html to 404.html

  //Due to how github pages works the 404 page handles all routing outside of the home page.
  //This is because github pages is not well equirped to handle single page applications
  //Not using the 404 page would result in a 404 error for all pages that are not the home page
  //To prevent this a custom 404 page is created that handles all routing which github pages considres as handling the 404 error
  //it would normally display.
  copyFileSync("../dist/index.html", "../dist/404.html");
  console.log("404.html created successfully.");
} catch (err) {
  console.error("Error creating 404.html:", err);
}
