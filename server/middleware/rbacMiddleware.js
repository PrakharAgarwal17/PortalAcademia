import profileModel, {} from "../models/profileModel.js";
/**
 * Higher-order middleware that validates whether the authenticated user possesses
 * one of the permitted AccountType roles.
 */
export function authorizeRoles(...allowedRoles) {
    return async (req, res, next) => {
        try {
            if (!req.userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: Session credentials missing.",
                });
            }
            const profile = await profileModel.findOne({ userId: req.userId });
            if (!profile) {
                return res.status(404).json({
                    success: false,
                    message: "User profile not found. Please complete onboarding first.",
                });
            }
            if (!allowedRoles.includes(profile.accountType)) {
                return res.status(403).json({
                    success: false,
                    message: `Forbidden: Action requires role [${allowedRoles.join(", ")}], but current profile is [${profile.accountType}].`,
                });
            }
            // Cache profile on request object to eliminate redundant DB reads in controllers
            req.userProfile = profile;
            return next();
        }
        catch (error) {
            console.error("RBAC Middleware Error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error during role validation.",
            });
        }
    };
}
// Convenience deterministic role guards
export const isStudent = authorizeRoles("student");
export const isFaculty = authorizeRoles("faculty");
export const isInstitution = authorizeRoles("institution");
export const isIndustry = authorizeRoles("industry");
export const isPublisher = authorizeRoles("industry", "institution");
export const isAcademic = authorizeRoles("student", "faculty", "institution");
//# sourceMappingURL=rbacMiddleware.js.map