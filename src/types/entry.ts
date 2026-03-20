/** 시트 열: A~J (영선일지 스프레드시트 기준) */
export type SheetEntry = {
  id: string;
  requestDate: string;
  requester: string;
  location: string;
  details: string;
  /** 요청사항사진 (Firebase Storage 다운로드 URL 등) */
  requestPhotoUrl: string;
  /** 조치사항 */
  actionTaken: string;
  /** 조치날짜 */
  actionDate: string;
  /** 비고 */
  remarks: string;
  /** 사진보기 (링크/표시용) */
  photoView: string;
};
