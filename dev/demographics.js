export default [
	{ type: "radiogroup", name: "gender", colCount: 0, isRequired: true, title: "What is your gender?", choices: ["Male", "Female", "Other", "Prefer not to say"] },
	{ type: "radiogroup", name: "native", colCount: 0, isRequired: true, title: "Are you a native English speaker", choices: ["Yes", "No"] },
	{ type: "text", name: "native language", visibleIf: "{native}='No'", title: "Please indicate your native language or languages:" },
	{ type: "text", name: "languages", title: "What other languages do you speak?" },
	{ type: "text", name: "age", title: "What is your age?", width: "auto" },
	{ type: "radiogroup", name: "degree", isRequired: true, title: "What is the highest degree or level of school you have completed. If currently enrolled, indicate highest degree received.", choices: ["Less than high school", "High school diploma", "Some college, no degree", "associates|Associate's degree", "bachelors|Bachelor's degree", "masters|Master's degree", "PhD, law, or medical degree", "Prefer not to say"] },
	{ type: "text", name: "comments", isRequired: false, title: "If you have any comments for us, please enter them here" },
];