export default [
	{ type: "radiogroup", name: "gender", colCount: 0, isRequired: true, title: "What is your gender?", choices: ["Male", "Female", "Other", "Prefer not to say"] },
	{ type: "text", name: "age", title: "What is your age?", width: "auto" },
 	{ type: "radiogroup", name: "colorVision", colCount: 0, isRequired: true, title: "Do you have any problems with color vision?", choices: ["No", "I am colorblind", "I suspect I may be colorblind"] },
    { type: "radiogroup", name: "performance", colCount: 1, isRequired: true, title: "How well do you think you did on the task?", choices: ["Very good - I spotted most of the changes right away", "Good - I spotted most of the changes, but it took me a while", "Okay - I spotted some changes and missed others", "Bad - I spotted only a few changes and missed many of them", "Very bad - I missed almost all the changes"] },
	{ type: "text", name: "comments", isRequired: false, title: "If you have any comments for us, please enter them here" },
];