/**
 * Kiểu domain Hall of Honor (sau normalize trong hallOfHonorService).
 * Dùng cho useState / props; mở rộng khi CMS thêm field.
 */

/** Tiểu mục trong category hoặc trên record */
export interface SubAwardDef {
  type?: string;
  label?: string;
  labelEng?: string;
  schoolYear?: string;
  semester?: number;
  month?: number;
  priority?: number;
  coverImage?: string | null;
}

export interface AwardCategory {
  _id: string;
  name?: string;
  nameEng?: string;
  description?: string;
  descriptionEng?: string;
  coverImage?: string | null;
  recipientType?: string;
  isActive?: boolean;
  campusId?: string;
  subAwards?: SubAwardDef[];
}

export interface SchoolYear {
  _id: string;
  name?: string;
  code?: string;
  startDate?: string;
  endDate?: string;
  isEnable?: boolean;
}

export interface HonorStudent {
  _id?: string;
  name?: string;
}

export interface StudentEntry {
  student?: HonorStudent | null;
  currentClass?: {
    _id?: string;
    name?: string;
    className?: string;
  } | null;
  photo?: string | null;
  note?: string;
  noteEng?: string;
  exam?: string;
  testName?: string;
  score?: string | number;
  activity?: string[];
  activityEng?: string[];
}

export interface ClassEntry {
  classInfo?: {
    _id?: string;
    name?: string;
    className?: string;
  } | null;
  note?: string;
  noteEng?: string;
  classImage?: string | null;
}

export interface AwardRecord {
  _id: string;
  awardCategory?: {
    _id?: string;
    name?: string;
    nameEng?: string;
  } | null;
  subAward?: SubAwardDef | null;
  students?: StudentEntry[];
  awardClasses?: ClassEntry[];
}
