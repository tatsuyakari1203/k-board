import mongoose, { Schema, Document, Model } from "mongoose";
import {
  BOARD_ROLES,
  INVITATION_STATUS,
  type BoardRole,
  type InvitationStatus,
} from "@/types/board-member";

// ============================================
// INTERFACES
// ============================================

export interface IBoardMember extends Document {
  _id: mongoose.Types.ObjectId;
  boardId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: BoardRole;
  addedBy?: mongoose.Types.ObjectId;
  addedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBoardInvitation extends Document {
  _id: mongoose.Types.ObjectId;
  boardId: mongoose.Types.ObjectId;
  email: string;
  role: BoardRole;
  invitedBy: mongoose.Types.ObjectId;
  status: InvitationStatus;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// BOARD MEMBER SCHEMA
// ============================================

const BoardMemberSchema = new Schema<IBoardMember>(
  {
    boardId: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(BOARD_ROLES),
      required: true,
      default: BOARD_ROLES.VIEWER,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique member per board
BoardMemberSchema.index({ boardId: 1, userId: 1 }, { unique: true });

// Index for finding all boards a user is member of
BoardMemberSchema.index({ userId: 1, role: 1 });

// ============================================
// BOARD INVITATION SCHEMA
// ============================================

const BoardInvitationSchema = new Schema<IBoardInvitation>(
  {
    boardId: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(BOARD_ROLES),
      required: true,
      default: BOARD_ROLES.VIEWER,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(INVITATION_STATUS),
      default: INVITATION_STATUS.PENDING,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    acceptedAt: {
      type: Date,
    },
    declinedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding invitations by email
BoardInvitationSchema.index({ email: 1, status: 1 });

// Index for finding pending invitations for a board
BoardInvitationSchema.index({ boardId: 1, status: 1 });

// TTL index to auto-expire old pending invitations (optional cleanup)
BoardInvitationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { status: "pending" } }
);

// ============================================
// STATIC METHODS
// ============================================

// Get member role for a user on a board
BoardMemberSchema.statics.getMemberRole = async function (
  boardId: string | mongoose.Types.ObjectId,
  userId: string | mongoose.Types.ObjectId
): Promise<BoardRole | null> {
  const member = await this.findOne({
    boardId: new mongoose.Types.ObjectId(boardId.toString()),
    userId: new mongoose.Types.ObjectId(userId.toString()),
  });
  return member?.role || null;
};

// Check if user is a member of board
BoardMemberSchema.statics.isMember = async function (
  boardId: string | mongoose.Types.ObjectId,
  userId: string | mongoose.Types.ObjectId
): Promise<boolean> {
  const count = await this.countDocuments({
    boardId: new mongoose.Types.ObjectId(boardId.toString()),
    userId: new mongoose.Types.ObjectId(userId.toString()),
  });
  return count > 0;
};

// Get all members of a board
BoardMemberSchema.statics.getBoardMembers = async function (
  boardId: string | mongoose.Types.ObjectId
): Promise<IBoardMember[]> {
  return this.find({
    boardId: new mongoose.Types.ObjectId(boardId.toString()),
  })
    .populate("userId", "name email")
    .populate("addedBy", "name")
    .sort({ role: 1, addedAt: 1 });
};

// Get all boards user is member of
BoardMemberSchema.statics.getUserBoards = async function (
  userId: string | mongoose.Types.ObjectId
): Promise<IBoardMember[]> {
  return this.find({
    userId: new mongoose.Types.ObjectId(userId.toString()),
  }).populate("boardId");
};

// ============================================
// EXPORT MODELS
// ============================================

// Extend Model interface with static methods
interface IBoardMemberModel extends Model<IBoardMember> {
  getMemberRole(
    boardId: string | mongoose.Types.ObjectId,
    userId: string | mongoose.Types.ObjectId
  ): Promise<BoardRole | null>;
  isMember(
    boardId: string | mongoose.Types.ObjectId,
    userId: string | mongoose.Types.ObjectId
  ): Promise<boolean>;
  getBoardMembers(
    boardId: string | mongoose.Types.ObjectId
  ): Promise<IBoardMember[]>;
  getUserBoards(
    userId: string | mongoose.Types.ObjectId
  ): Promise<IBoardMember[]>;
}

export const BoardMember: IBoardMemberModel =
  (mongoose.models.BoardMember as IBoardMemberModel) ||
  mongoose.model<IBoardMember, IBoardMemberModel>("BoardMember", BoardMemberSchema);

export const BoardInvitation: Model<IBoardInvitation> =
  mongoose.models.BoardInvitation ||
  mongoose.model<IBoardInvitation>("BoardInvitation", BoardInvitationSchema);

export default BoardMember;
