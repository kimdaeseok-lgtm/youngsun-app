/**
 * 시트 행: A=연번, B=요청날짜, C=요청자, D=요청장소, E=요청내용,
 * F=요청사항사진, G=조치사항, H=조치사항사진, I=조치날짜, J=사진보기
 */
export interface SheetEntry {
  id: string;
  requestDate: string;
  requester: string;
  location: string;
  details: string;
  requestPhotoUrl: string;
  actionTaken: string;   // G 조치사항(조치내용)
  actionPhotoUrl: string; // H 조치사항사진(조치후사진)
  actionDate: string;   // I 조치날짜
}
