async function fetchMilestoneProgress() {
    const queryParams = new URLSearchParams(window.location.search);
    const user = queryParams.get("user");
    const repo = queryParams.get("repo");
    const milestone = queryParams.get("milestone");

    const progressFill = document.querySelector(".progress-fill");
    const progressInfo = document.querySelector(".progress-info");

    if (!user || !repo || !milestone) {
        progressInfo.textContent = "Invalid URL parameters.";
        return;
    }

    try {
        // Fetch milestones
        const milestonesUrl = `https://api.github.com/repos/${user}/${repo}/milestones`;
        const response = await fetch(milestonesUrl);
        const milestones = await response.json();

        const selectedMilestone = milestones.find(m => m.title === milestone);

        if (!selectedMilestone) {
            progressInfo.textContent = "Milestone not found.";
            return;
        }

        const { open_issues, closed_issues } = selectedMilestone;
        const totalIssues = open_issues + closed_issues;

        const progressPercentage = totalIssues
            ? Math.round((closed_issues / totalIssues) * 100)
            : 0;

        progressFill.style.width = `${progressPercentage}%`;
        progressInfo.textContent = `${progressPercentage}% Complete (${closed_issues}/${totalIssues} Issues)`;
    } catch (error) {
        console.error("Error fetching milestone data:", error);
        progressInfo.textContent = "Error loading progress.";
    }
}

document.addEventListener("DOMContentLoaded", fetchMilestoneProgress);
