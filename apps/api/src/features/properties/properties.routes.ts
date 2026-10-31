import { Router } from "express";
import { CreatePropertyInputSchema } from "@imob/shared";
import { parseId, parseInput } from "../../shared/http";
import { currentUser } from "../auth/auth.middleware";
import { createProperty, getPropertyDetail, listProperties } from "./properties.service";

export const propertiesRouter = Router();

propertiesRouter.get("/", async (req, res) => {
  res.json(await listProperties(currentUser(req).id));
});

propertiesRouter.post("/", async (req, res) => {
  res.status(201).json(await createProperty(currentUser(req).id, parseInput(CreatePropertyInputSchema, req.body)));
});

propertiesRouter.get("/:id", async (req, res) => {
  res.json(await getPropertyDetail(currentUser(req).id, parseId(req.params.id)));
});
