import { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

function MatchingPostCreate() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [artistType, setArtistType] = useState('WRITER');
  const [workType, setWorkType] = useState('HYBRID');
  const [files, setFiles] = useState([]); // 업로드된 파일 상태
  const [matchingPostId, setMatchingPostId] = useState(null); // 매칭 포스트 ID 상태
  const [matchingPostImageIds, setMatchingPostImageIds] = useState([]); // 업로드된 이미지 ID 상태
  const [uploading, setUploading] = useState(false); // 업로드 진행 상태
  const [uploadError, setUploadError] = useState(null); // 업로드 에러 상태
  const navigate = useNavigate();
  const MAX_FILES = 3; // 총 이미지 수 제한 (이미지만)

  // 페이지 로드 시 빈 MatchingPost 생성 및 ID 발급
  useEffect(() => {
    const checkAuthAndFetchPostId = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        navigate('/login');
        return;
      }

      try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/matching-posts/write`, {}, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.data.success_or_fail) {
          setMatchingPostId(response.data.data); // 반환된 ID 저장
        } else {
          // 여기서 AccessToken refresh 해줘야 하는데 아직 그 로직이 없다. 우선 로그인 창으로 빼야 할까?
          throw new Error(response.data.message || '매칭 포스트 ID 생성 실패');
        }
      } catch (err) {
        setUploadError('매칭 포스트 생성 중 오류가 발생했습니다: ' + err.message);
      }
    };

    checkAuthAndFetchPostId();
  }, [navigate]);

  // 파일 입력 필드 클릭 시 이미지 제한 확인
  const handleFileInputClick = (event) => {
    const currentImages = files.filter(file => file.type.startsWith('image/')).length;
    if (currentImages >= MAX_FILES) {
      event.preventDefault();
      alert(`이미지는 최대 ${MAX_FILES}장까지 업로드할 수 있습니다.`);
    }
  };

  // 파일/이미지 선택 핸들러 (Presigned URL 받아서 S3 업로드)
  const handleFileChange = async (event) => {
    const newFiles = Array.from(event.target.files).filter(file => file.type.startsWith('image/')); // 이미지 파일만 필터링
    const currentImages = files.filter(file => file.type.startsWith('image/')).length;

    if (currentImages + newFiles.length > MAX_FILES) {
      alert(`이미지는 최대 ${MAX_FILES}장까지 업로드할 수 있습니다.`);
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const uploadPromises = newFiles.map(async (file) => {
        if (!matchingPostId) {
          throw new Error('매칭 포스트 ID가 설정되지 않았습니다.');
        }

        // 1. Presigned URL 및 MatchingPostImage ID 요청
        // directory는 'matchingpost', id는 matchingPostId, fileName은 파일 이름 사용
        const presignedResponse = await axios.post(`${process.env.REACT_APP_API_URL}/images/upload`, {
          directory: 'matchingpost',
          id: matchingPostId,
          file_name: file.name,
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
            'Content-Type': 'application/json',
          },
        });

        if (!presignedResponse.data.success_or_fail) {
          throw new Error(presignedResponse.data.message || 'Presigned URL 요청 실패');
        }

        const presignedUrl = presignedResponse.data.data.uploading_image_url;
        const imageEntityId = presignedResponse.data.data.image_entity_id;

        // 2. S3에 파일 업로드 (Presigned URL 사용)
        await axios.put(presignedUrl, file, {
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
        });

        // 업로드 성공 시 이미지 ID 저장
        setMatchingPostImageIds(prevIds => [...prevIds, imageEntityId]);
        return file;
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      const updatedFiles = [...files, ...uploadedFiles].slice(0, MAX_FILES);
      setFiles(updatedFiles);
    } catch (err) {
      setUploadError('이미지 업로드 실패: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  // 파일/이미지 삭제 핸들러 (S3 및 DB에서 삭제)
  const handleFileRemove = async (index) => {
    const fileToRemove = files[index];
    const imageIdToRemove = matchingPostImageIds[index];

    if (!imageIdToRemove || !matchingPostId) {
      setFiles(files.filter((_, i) => i !== index));
      setMatchingPostImageIds(matchingPostImageIds.filter((_, i) => i !== index));
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // 서버에 이미지 삭제 요청 (S3 및 DB에서 제거)
      await axios.delete(`${process.env.REACT_APP_API_URL}/matching-posts/images/${imageIdToRemove}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
        },
      });

      // 로컬 상태 업데이트
      setFiles(files.filter((_, i) => i !== index));
      setMatchingPostImageIds(matchingPostImageIds.filter((_, i) => i !== index));
    } catch (err) {
      setUploadError('이미지 삭제 실패: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  // 폼 제출 핸들러 (JSON 형식으로 매칭 포스트 수정/등록)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!matchingPostId) {
      setUploadError('매칭 포스트 ID를 가져오지 못했습니다. 다시 시도해주세요.');
      return;
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      navigate('/login');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // JSON 데이터 준비
      const requestData = {
        title,
        description,
        artist_type: artistType,
        work_type: workType,
        matching_post_image_ids: matchingPostImageIds, // 이미지 ID 리스트
      };

      // JSON 형식으로 PUT 요청
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/matching-posts/${matchingPostId}`, requestData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json', // JSON 형식으로 변경
        },
      });

      if (response.data.success_or_fail) {
        navigate('/');
      } else {
        throw new Error(response.data.message || '매칭 포스트 저장 실패');
      }
    } catch (err) {
      setUploadError('매칭 포스트 작성 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <Typography variant="h4" gutterBottom>매칭 포스트 작성</Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
              fullWidth
              label="제목 *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              margin="normal"
              required
          />
          <TextField
              fullWidth
              label="설명 *"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              margin="normal"
              multiline
              rows={4}
              required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="artist-type-label">작가 타입 *</InputLabel>
            <Select
                labelId="artist-type-label"
                value={artistType}
                onChange={(e) => setArtistType(e.target.value)}
                label="작가 타입"
            >
              <MenuItem value="WRITER">글작가</MenuItem>
              <MenuItem value="ILLUSTRATOR">그림작가</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel id="work-type-label">업무 형태 *</InputLabel>
            <Select
                labelId="work-type-label"
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                label="업무 형태"
            >
              <MenuItem value="ONLINE">온라인</MenuItem>
              <MenuItem value="OFFLINE">오프라인</MenuItem>
              <MenuItem value="HYBRID">하이브리드</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ mt: 2 }}>
            <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                onClick={handleFileInputClick}
                style={{ marginBottom: '10px' }}
            />
            <Typography variant="body2" color="text.secondary">
              최대 {MAX_FILES}장까지 업로드 가능 (현재 {files.length}/{MAX_FILES})
            </Typography>
            <ImageList sx={{ width: '100%', height: files.length > 0 ? 150 : 0 }} cols={Math.min(files.length, 5)} rowHeight={100}>
              {files.map((file, index) => (
                  <ImageListItem key={file.name}>
                    <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        loading="lazy"
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                    <ImageListItemBar
                        sx={{
                          background: 'rgba(0, 0, 0, 0.5)',
                          position: 'absolute',
                          top: 0,
                          right: 0,
                        }}
                        actionIcon={
                          <IconButton
                              sx={{ color: 'white' }}
                              onClick={() => handleFileRemove(index)}
                              aria-label={`삭제 ${file.name}`}
                          >
                            <CloseIcon />
                          </IconButton>
                        }
                    />
                  </ImageListItem>
              ))}
            </ImageList>
            {uploading && <CircularProgress sx={{ mt: 2 }} />}
            {uploadError && (
                <Typography variant="body1" color="error.main" sx={{ mt: 2 }}>
                  {uploadError}
                </Typography>
            )}
          </Box>
          <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }} disabled={uploading}>
            작성
          </Button>
        </Box>
      </div>
  );
}

export default MatchingPostCreate;