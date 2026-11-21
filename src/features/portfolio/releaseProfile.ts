export const connectedReview = import.meta.env.MODE === "review";
export const companyRelease = import.meta.env.MODE === "company";
export const legacyPortfolio = connectedReview || companyRelease;
export const connectedReviewCallback = "/preview/live-portfolio";
