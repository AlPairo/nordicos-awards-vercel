// api/nominees/index.js - Unified nominees handler
import {
  listNominees,
  createNominee,
  getNomineeById,
  updateNominee,
  deleteNominee,
} from "../../services/nominees.js";
import { getCategoryById } from "../../services/categories.js";
import { findMediaById } from "../../services/media.js";
import { verifyAdminAuth } from "../../utils/auth.js";

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    return res.status(200).end();
  }

  // Set CORS headers for all requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  const { id } = req.query;

  // GET: Get single nominee by ID or list all nominees
  if (req.method === "GET") {
    try {
      // Single nominee: GET /api/nominees?id={id}
      if (id) {
        const nominee = await getNomineeById(id);
        if (!nominee) {
          return res.status(404).json({
            success: false,
            message: "Nominee not found",
          });
        }

        return res.json({
          success: true,
          data: nominee,
        });
      }

      // List nominees: GET /api/nominees
      const categoryId = req.query.category_id;
      const onlyActive = req.query.only_active !== "false";

      const nominees = await listNominees({ categoryId, onlyActive });

      return res.json({
        success: true,
        data: nominees,
      });
    } catch (error) {
      console.error("List nominees error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error fetching nominees",
      });
    }
  }

  // POST: Create nominee (admin only)
  if (req.method === "POST") {
    try {
      const user = await verifyAdminAuth(req);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - Admin access required",
        });
      }

      const { name, description, category, linked_media } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Nominee name is required",
        });
      }

      if (!category) {
        return res.status(400).json({
          success: false,
          message: "Category is required",
        });
      }

      // Validate category exists
      const categoryExists = await getCategoryById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: "Invalid category",
        });
      }

      // Validate media if provided
      if (linked_media) {
        const mediaExists = await findMediaById(linked_media);
        if (!mediaExists) {
          return res.status(400).json({
            success: false,
            message: "Invalid media ID",
          });
        }
        if (mediaExists.status !== "approved") {
          return res.status(400).json({
            success: false,
            message: "Media must be approved before linking",
          });
        }
      }

      const nomineeId = await createNominee({
        ...req.body,
        createdBy: user.id,
      });

      return res.status(201).json({
        success: true,
        message: "Nominee created successfully",
        data: { id: nomineeId },
      });
    } catch (error) {
      console.error("Create nominee error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error creating nominee",
      });
    }
  }

  // PUT: Update nominee by ID (admin only)
  if (req.method === "PUT") {
    try {
      const user = await verifyAdminAuth(req);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - Admin access required",
        });
      }

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Nominee ID is required",
        });
      }

      const nominee = await getNomineeById(id);
      if (!nominee) {
        return res.status(404).json({
          success: false,
          message: "Nominee not found",
        });
      }

      // Validate category if provided
      if (req.body.category) {
        const categoryExists = await getCategoryById(req.body.category);
        if (!categoryExists) {
          return res.status(400).json({
            success: false,
            message: "Invalid category",
          });
        }
      }

      // Validate media if provided
      if (req.body.linked_media) {
        const mediaExists = await findMediaById(req.body.linked_media);
        if (!mediaExists) {
          return res.status(400).json({
            success: false,
            message: "Invalid media ID",
          });
        }
      }

      await updateNominee(id, req.body);

      return res.json({
        success: true,
        message: "Nominee updated successfully",
      });
    } catch (error) {
      console.error("Update nominee error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error updating nominee",
      });
    }
  }

  // DELETE: Delete nominee by ID (admin only)
  if (req.method === "DELETE") {
    try {
      const user = await verifyAdminAuth(req);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - Admin access required",
        });
      }

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Nominee ID is required",
        });
      }

      const nominee = await getNomineeById(id);
      if (!nominee) {
        return res.status(404).json({
          success: false,
          message: "Nominee not found",
        });
      }

      await deleteNominee(id);

      return res.json({
        success: true,
        message: "Nominee deleted successfully",
      });
    } catch (error) {
      console.error("Delete nominee error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error deleting nominee",
      });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
