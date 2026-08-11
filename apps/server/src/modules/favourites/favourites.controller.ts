import { Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import type {
  AuthUser,
  FavouriteListResponse,
  FavouriteMutationResponse,
} from "@travelverse/contracts";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { AuthGuard } from "../auth/guards/auth.guard";
import { FavouritesService } from "./favourites.service";

@Controller("favourites")
@UseGuards(AuthGuard)
export class FavouritesController {
  constructor(private readonly favouritesService: FavouritesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<FavouriteListResponse> {
    return this.favouritesService.listForUser(user.id);
  }

  @Post(":slug")
  add(
    @CurrentUser() user: AuthUser,
    @Param("slug") destinationSlug: string,
  ): Promise<FavouriteMutationResponse> {
    return this.favouritesService.add(user.id, destinationSlug);
  }

  @Delete(":slug")
  remove(
    @CurrentUser() user: AuthUser,
    @Param("slug") destinationSlug: string,
  ): Promise<FavouriteMutationResponse> {
    return this.favouritesService.remove(user.id, destinationSlug);
  }
}
