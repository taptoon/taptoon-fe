import { useState } from 'react';
import { TextField, Button, Box, Typography, Select, MenuItem, FormControl, InputLabel, IconButton, ImageList, ImageListItem, ImageListItemBar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';

function MatchingPostCreate() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [artistType, setArtistType] = useState('WRITER');
  const [workType, setWorkType] = useState('HYBRID');
  const [files, setFiles] = useState([]); // 업로드된 파일 상태
  const navigate = useNavigate();
  const MAX_FILES = 10; // 최대 파일 수

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    const updatedFiles = [...files, ...newFiles].slice(0, MAX_FILES); // 최대 10장까지 제한
    setFiles(updatedFiles);
  };

  const handleFileRemove = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('artistType', artistType);
    formData.append('workType', workType);

    // 파일 추가
    files.forEach((file) => {
      formData.append('fileList', file);
    });

    try {
      const response = await fetch('http://localhost:8080/matching-posts', {
        method: 'POST',
        body: formData, // FormData로 파일 전송
      });
      if (!response.ok) throw new Error('게시글 작성 실패');
      const result = await response.json();
      if (result.successOrFail) {
        navigate('/');
      }
    } catch (err) {
      alert('게시글 작성 중 오류가 발생했습니다: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>게시글 작성</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <TextField
          fullWidth
          label="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="설명"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          multiline
          rows={4}
          required
        />
        <FormControl fullWidth margin="normal">
          <InputLabel id="artist-type-label">작가 타입</InputLabel>
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
          <InputLabel id="work-type-label">업무 형태</InputLabel>
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
            style={{ marginBottom: '10px' }}
          />
          <Typography variant="body2" color="text.secondary">
            최대 {MAX_FILES}장까지 업로드 가능 (현재 {files.length}/{MAX_FILES})
          </Typography>
          <ImageList sx={{ width: '100%', height: 150 }} cols={5} rowHeight={100}>
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
        </Box>
        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
          작성
        </Button>
      </Box>
    </div>
  );
}

export default MatchingPostCreate;