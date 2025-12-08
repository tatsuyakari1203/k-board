import { PropertyType, ViewType } from "@/types/board";

export interface BoardTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  properties: Array<{
    name: string;
    type: string;
    options?: Array<{ label: string; color: string }>;
    required?: boolean;
    width?: number;
  }>;
  views: Array<{
    name: string;
    type: string;
    config: {
      groupBy?: string; // Property name to group by
      visibleProperties?: string[]; // Property names to show
    };
  }>;
}

export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: "survey",
    name: "Hồ sơ đo đạc",
    description: "Quản lý quy trình đo đạc, tách thửa và cấp giấy chứng nhận",
    icon: "📐",
    properties: [
      { name: "Tên khách hàng", type: PropertyType.TEXT, required: true, width: 200 },
      { name: "Địa chỉ thửa đất", type: PropertyType.TEXT, required: true, width: 250 },
      {
        name: "Mục đích đo",
        type: PropertyType.SELECT,
        width: 150,
        options: [
          { label: "Tách thửa", color: "bg-purple-100 text-purple-800" },
          { label: "Cấp GCN", color: "bg-orange-100 text-orange-800" },
          { label: "Cắm mốc", color: "bg-blue-100 text-blue-800" },
          { label: "Khác", color: "bg-gray-100 text-gray-800" },
        ],
      },
      { name: "Ngày nhận hồ sơ", type: PropertyType.DATE, width: 130 },
      { name: "Ngày đo thực địa", type: PropertyType.DATE, width: 130 },
      { name: "Kỹ thuật viên", type: PropertyType.PERSON, width: 150 },
      {
        name: "Trạng thái hồ sơ",
        type: PropertyType.STATUS,
        width: 150,
        options: [
          { label: "Mới tiếp nhận", color: "bg-gray-100 text-gray-800" },
          { label: "Đang xử lý", color: "bg-blue-100 text-blue-800" },
          { label: "Đã đo đạc", color: "bg-yellow-100 text-yellow-800" },
          { label: "Đợi kỹ thuật", color: "bg-orange-100 text-orange-800" },
          { label: "Hoàn thành", color: "bg-green-100 text-green-800" },
        ],
      },
      { name: "Ngày hoàn thành bản vẽ", type: PropertyType.DATE, width: 150 },
      { name: "Ngày nộp VPĐKĐĐ", type: PropertyType.DATE, width: 150 },
      { name: "Ngày trả kết quả", type: PropertyType.DATE, width: 150 },
      { name: "Phí dịch vụ", type: PropertyType.CURRENCY, width: 130 },
      { name: "Đã thu", type: PropertyType.CURRENCY, width: 130 },
      { name: "Còn lại", type: PropertyType.CURRENCY, width: 130 },
      { name: "Ghi chú", type: PropertyType.RICH_TEXT, width: 300 },
    ],
    views: [
      {
        name: "Tất cả hồ sơ",
        type: ViewType.TABLE,
        config: {
          visibleProperties: [
            "Tên khách hàng",
            "Địa chỉ thửa đất",
            "Mục đích đo",
            "Ngày nhận hồ sơ",
            "Ngày đo thực địa",
            "Kỹ thuật viên",
            "Trạng thái hồ sơ",
            "Ngày hoàn thành bản vẽ",
            "Ngày nộp VPĐKĐĐ",
            "Ngày trả kết quả",
            "Phí dịch vụ",
            "Đã thu",
            "Còn lại",
            "Ghi chú",
          ],
        },
      },
      {
        name: "Theo trạng thái",
        type: ViewType.KANBAN,
        config: {
          groupBy: "Trạng thái hồ sơ",
        },
      },
    ],
  },
  {
    id: "software",
    name: "Phát triển phần mềm",
    description: "Theo dõi tasks, bugs và features theo quy trình Agile/Scrum",
    icon: "💻",
    properties: [
      { name: "Task", type: PropertyType.TEXT, required: true, width: 300 },
      {
        name: "Trạng thái",
        type: PropertyType.STATUS,
        width: 140,
        options: [
          { label: "Backlog", color: "bg-gray-100 text-gray-800" },
          { label: "Todo", color: "bg-blue-100 text-blue-800" },
          { label: "In Progress", color: "bg-yellow-100 text-yellow-800" },
          { label: "In Review", color: "bg-purple-100 text-purple-800" },
          { label: "Done", color: "bg-green-100 text-green-800" },
        ],
      },
      {
        name: "Độ ưu tiên",
        type: PropertyType.SELECT,
        width: 120,
        options: [
          { label: "High", color: "bg-red-100 text-red-800" },
          { label: "Medium", color: "bg-orange-100 text-orange-800" },
          { label: "Low", color: "bg-green-100 text-green-800" },
        ],
      },
      { name: "Assignee", type: PropertyType.PERSON, width: 150 },
      { name: "Sprint", type: PropertyType.TEXT, width: 120 },
      { name: "Due Date", type: PropertyType.DATE, width: 130 },
      {
        name: "Loại",
        type: PropertyType.SELECT,
        width: 120,
        options: [
          { label: "Feature", color: "bg-blue-100 text-blue-800" },
          { label: "Bug", color: "bg-red-100 text-red-800" },
          { label: "Improvement", color: "bg-green-100 text-green-800" },
        ],
      },
    ],
    views: [
      {
        name: "Board",
        type: ViewType.KANBAN,
        config: {
          groupBy: "Trạng thái",
        },
      },
      {
        name: "List",
        type: ViewType.TABLE,
        config: {
          visibleProperties: ["Task", "Trạng thái", "Assignee", "Due Date", "Độ ưu tiên"],
        },
      },
      {
        name: "Bugs",
        type: ViewType.TABLE,
        config: {
          visibleProperties: ["Task", "Trạng thái", "Assignee"],
        },
      },
    ],
  },
  {
    id: "crm",
    name: "Sales CRM",
    description: "Quản lý khách hàng tiềm năng và quy trình chốt đơn",
    icon: "💰",
    properties: [
      { name: "Lead Name", type: PropertyType.TEXT, required: true, width: 250 },
      { name: "Company", type: PropertyType.TEXT, width: 200 },
      {
        name: "Stage",
        type: PropertyType.STATUS,
        width: 150,
        options: [
          { label: "New Lead", color: "bg-blue-100 text-blue-800" },
          { label: "Contacted", color: "bg-yellow-100 text-yellow-800" },
          { label: "Proposal", color: "bg-purple-100 text-purple-800" },
          { label: "Negotiation", color: "bg-orange-100 text-orange-800" },
          { label: "Won", color: "bg-green-100 text-green-800" },
          { label: "Lost", color: "bg-gray-100 text-gray-800" },
        ],
      },
      { name: "Deal Value", type: PropertyType.CURRENCY, width: 130 },
      { name: "Confidence", type: PropertyType.NUMBER, width: 100 },
      { name: "Contact Email", type: PropertyType.TEXT, width: 200 },
      { name: "Phone", type: PropertyType.TEXT, width: 150 },
      { name: "Owner", type: PropertyType.PERSON, width: 150 },
      { name: "Last Contact", type: PropertyType.DATE, width: 130 },
    ],
    views: [
      {
        name: "Pipeline",
        type: ViewType.KANBAN,
        config: {
          groupBy: "Stage",
        },
      },
      {
        name: "All Deals",
        type: ViewType.TABLE,
        config: {
          visibleProperties: ["Lead Name", "Company", "Stage", "Deal Value", "Owner"],
        },
      },
    ],
  },
  {
    id: "content",
    name: "Lịch nội dung",
    description: "Lên kế hoạch và theo dõi tiến độ sản xuất nội dung",
    icon: "📅",
    properties: [
      { name: "Tiêu đề", type: PropertyType.TEXT, required: true, width: 300 },
      {
        name: "Trạng thái",
        type: PropertyType.STATUS,
        width: 140,
        options: [
          { label: "Ý tưởng", color: "bg-gray-100 text-gray-800" },
          { label: "Phác thảo", color: "bg-blue-100 text-blue-800" },
          { label: "Review", color: "bg-yellow-100 text-yellow-800" },
          { label: "Sẵn sàng", color: "bg-green-100 text-green-800" },
          { label: "Đã đăng", color: "bg-purple-100 text-purple-800" },
        ],
      },
      {
        name: "Kênh",
        type: PropertyType.MULTI_SELECT,
        width: 150,
        options: [
          { label: "Website", color: "bg-blue-100 text-blue-800" },
          { label: "Facebook", color: "bg-blue-600 text-white" },
          { label: "Instagram", color: "bg-pink-100 text-pink-800" },
          { label: "Email", color: "bg-yellow-100 text-yellow-800" },
          { label: "LinkedIn", color: "bg-blue-700 text-white" },
        ],
      },
      { name: "Ngày đăng", type: PropertyType.DATE, width: 130 },
      { name: "Người viết", type: PropertyType.PERSON, width: 150 },
      { name: "Link bài viết", type: PropertyType.TEXT, width: 200 },
    ],
    views: [
      {
        name: "Quy trình",
        type: ViewType.KANBAN,
        config: {
          groupBy: "Trạng thái",
        },
      },
      {
        name: "Lịch đăng",
        type: ViewType.TABLE,
        config: {
          visibleProperties: ["Tiêu đề", "Trạng thái", "Ngày đăng", "Kênh"],
        },
      },
    ],
  },
];
