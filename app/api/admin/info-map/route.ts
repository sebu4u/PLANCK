import { INFO_MAP_CONFIG } from "@/lib/subject-map/config"
import { createSubjectMapAdminHandlers } from "@/lib/subject-map/admin-api-handlers"

const handlers = createSubjectMapAdminHandlers(INFO_MAP_CONFIG, "admin/info-map")

export const GET = handlers.GET
export const POST = handlers.POST
export const PUT = handlers.PUT
export const DELETE = handlers.DELETE
