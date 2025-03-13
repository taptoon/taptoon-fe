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
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import axios from 'axios';

function CreateMatchingPost() {
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
        ['userId', 'accessToken', 'refreshToken'].forEach(item => localStorage.removeItem(item));
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

        // 401 에러 처리: accessToken 만료 시 로그인 페이지로 리다이렉션
        if (response.status === 401) {
          handleUnauthorized();
        }

        if (response.data.success_or_fail) {
          setMatchingPostId(response.data.data); // 반환된 ID 저장
        } else {
          throw new Error(response.data.message || '매칭 포스트 ID 생성 실패');
        }
      } catch (err) {
        setUploadError('매칭 포스트 생성 중 오류가 발생했습니다: ' + err.message);
        handleUnauthorized();
      }
    };

    checkAuthAndFetchPostId();
  }, [navigate]);

  // 파일 입력 필드 클릭 시 이미지 제한 확인
  const handleFileInputClick = (event) => {
    if (files.length >= MAX_FILES) {
      event.preventDefault();
      alert(`이미지는 최대 ${MAX_FILES}장까지 업로드할 수 있습니다.`);
    }
  };

  const handleUnauthorized = () => {
    ['userId', 'accessToken', 'refreshToken'].forEach(item => localStorage.removeItem(item));
    navigate('/login');
    return;
  }

  // 파일/이미지 선택 핸들러 (Presigned URL 받아서 S3 업로드)
  const handleFileChange = async (event) => {
    const newFiles = Array.from(event.target.files).filter(file => file.type.startsWith('image/')); // 이미지 파일만 필터링

    if (files.length + newFiles.length > MAX_FILES) {
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

        // Presigned URL 및 MatchingPostImage ID 요청
        const presignedResponse = await axios.post(`${process.env.REACT_APP_API_URL}/images/upload`, {
          directory: `${process.env.REACT_APP_S3_MATCHING_POST_DIRECTORY}`,
          id: matchingPostId,
          file_type: `${process.env.REACT_APP_S3_IMAGE_TYPE}`,
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

        // S3에 파일 업로드
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

  // 파일/이미지 삭제 핸들러 (로컬 상태만 업데이트, S3 및 DB 삭제 요청 X)
  const handleFileRemove = (index) => {
    setFiles(files.filter((_, i) => i !== index));
    setMatchingPostImageIds(matchingPostImageIds.filter((_, i) => i !== index));
  };

  // 폼 제출 핸들러 (JSON 형식으로 매칭 포스트 등록)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!matchingPostId) {
      setUploadError('매칭 포스트 ID를 가져오지 못했습니다. 다시 시도해주세요.');
      return;
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      handleUnauthorized();
    }

    setUploading(true);
    setUploadError(null);

    try {
      const requestData = {
        title,
        description,
        artist_type: artistType,
        work_type: workType,
        matching_post_image_ids: matchingPostImageIds, // 이미지 ID 리스트
      };

      const response = await axios.put(`${process.env.REACT_APP_API_URL}/matching-posts/${matchingPostId}/registration`, requestData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
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
            <Button
                variant="contained"
                component="label"
                startIcon={<AttachFileIcon />}
                sx={{ mb: 2 }}
            >
              이미지 선택
              <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleFileChange}
                  onClick={handleFileInputClick}
              />
            </Button>
            <Typography variant="body2" color="text.secondary">
              {files.length === 0 ? '선택된 이미지 없음' : `선택된 이미지: ${files.length}/${MAX_FILES}`}
            </Typography>
            <ImageList sx={{ width: '100%', mt: 2 }} cols={Math.min(files.length || 1, 3)} rowHeight={500}>
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
            {files.length > 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  업로드된 이미지 파일명: {files.map(file => file.name).join(', ')}
                </Typography>
            )}
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

export default CreateMatchingPost;