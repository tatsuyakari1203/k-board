export interface Role {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  boardId?: string | null;
  createdAt: string;
  updatedAt: string;
}
