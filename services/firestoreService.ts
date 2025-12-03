
import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, writeBatch, setDoc, getDoc } from 'firebase/firestore';
import { Project, User, Inspection, UserRole } from '../types';
import { mockProjects, mockUsers } from './mockData';

// Collection References
const PROJECTS_COLLECTION = 'projects';
const USERS_COLLECTION = 'users';
const INSPECTIONS_COLLECTION = 'inspections';

// --- Projects Service ---

// 프로젝트 목록 가져오기
export const fetchProjects = async (): Promise<Project[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, PROJECTS_COLLECTION));
    if (querySnapshot.empty) {
        console.warn("No projects found in DB. Returning empty array.");
        return [];
    }
    return querySnapshot.docs.map(doc => ({
      ...doc.data() as Project,
    }));
  } catch (error) {
    console.error("Error fetching projects:", error);
    return mockProjects;
  }
};

// 프로젝트 추가
export const addProjectToDB = async (project: Project) => {
  try {
    await addDoc(collection(db, PROJECTS_COLLECTION), project);
    console.log("Project added to DB:", project.name);
  } catch (error) {
    console.error("Error adding project:", error);
    throw error;
  }
};

// 프로젝트 업데이트 (단일 Task)
export const updateProjectInDB = async (project: Project) => {
  try {
    const q = query(
      collection(db, PROJECTS_COLLECTION), 
      where("id", "==", project.id),
      where("taskNumber", "==", project.taskNumber)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, { ...project });
      console.log("Project updated in DB");
    } else {
      console.error("Project not found in DB to update");
    }
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

// 프로젝트 일괄 업데이트 (제번/이름 변경 시 해당 ID를 가진 모든 Task 업데이트)
export const updateProjectBatchInDB = async (oldId: string, newId: string, newName: string) => {
  try {
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where("id", "==", oldId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const batch = writeBatch(db);
      
      querySnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { 
          id: newId, 
          name: newName 
        });
      });
      
      await batch.commit();
      console.log(`Batch updated ${querySnapshot.size} tasks from ${oldId} to ${newId}`);
    } else {
      console.log("No matching projects found for batch update");
    }
  } catch (error) {
    console.error("Error batch updating project:", error);
    throw error;
  }
};

// --- Users Service ---

export const fetchUsers = async (): Promise<User[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    if (querySnapshot.empty) {
        return [];
    }
    return querySnapshot.docs.map(doc => doc.data() as User);
  } catch (error) {
    console.error("Error fetching users:", error);
    return mockUsers;
  }
};

export const addUserToDB = async (user: User) => {
  try {
    // ID를 문서 키로 사용하여 중복 방지 및 쉬운 조회
    await setDoc(doc(db, USERS_COLLECTION, user.id), user);
  } catch (error) {
    console.error("Error adding user:", error);
    throw error;
  }
};

export const updateUserInDB = async (user: User) => {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, user.id), { ...user });
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

// 로그인 인증: ID와 비밀번호(또는 이름) 확인
export const verifyUser = async (id: string, nameOrPw: string): Promise<User | null> => {
  try {
    // 1. Super Admin Hardcoded Check & DB Sync
    if (id === 'admin' && nameOrPw === 'qngkgk78') {
        const adminUser: User = {
            id: 'admin',
            name: '최고관리자',
            role: UserRole.ADMIN,
            department: '시스템관리',
            email: 'admin@qms.com',
            status: 'active',
            joinedDate: new Date().toISOString().split('T')[0]
        };

        // 관리자 정보를 DB에 저장/업데이트
        await setDoc(doc(db, USERS_COLLECTION, 'admin'), adminUser);
        console.log("Super Admin sync to DB successful");
        return adminUser;
    }

    // 2. DB Check
    const userDocRef = doc(db, USERS_COLLECTION, id);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as User;

      // 비활성화 계정 차단
      if (userData.status !== 'active') {
        return null;
      }

      // 비밀번호가 설정된 경우 비밀번호 체크
      if (userData.password) {
        if (userData.password === nameOrPw) {
          return userData;
        }
      } else {
        // 비밀번호가 없는 구형 계정인 경우 이름으로 체크 (Legacy Support)
        if (userData.name === nameOrPw) {
          return userData;
        }
      }
    }
    
    // DB에 없으면 Mock Data 확인 (초기 데모용)
    const mockUser = mockUsers.find(u => u.id === id && u.name === nameOrPw && u.status === 'active');
    return mockUser || null;

  } catch (error) {
    console.error("Error verifying user:", error);
    // Fallback
    const mockUser = mockUsers.find(u => u.id === id && u.name === nameOrPw && u.status === 'active');
    return mockUser || null;
  }
};

// --- Inspections Service ---

export const fetchInspections = async (): Promise<Inspection[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, INSPECTIONS_COLLECTION));
    if (querySnapshot.empty) {
      return [];
    }
    return querySnapshot.docs.map(doc => doc.data() as Inspection);
  } catch (error) {
    console.error("Error fetching inspections:", error);
    return [];
  }
};

export const addInspectionToDB = async (inspection: Inspection) => {
  try {
    // 고유 ID 생성 (프로젝트ID_Task_PanelID_Type)하여 덮어쓰기(수정) 가능하게 함
    // 공정 검사와 최종 검사가 구분되어 저장되어야 함
    const docId = `${inspection.projectId}_${inspection.taskNumber}_${inspection.panelId}_${inspection.type}`;
    await setDoc(doc(db, INSPECTIONS_COLLECTION, docId), inspection);
    console.log("Inspection saved/updated to DB:", docId);
  } catch (error) {
    console.error("Error saving inspection:", error);
    throw error;
  }
};
