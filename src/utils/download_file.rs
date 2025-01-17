use anyhow::Result;
use futures_util::StreamExt;
use regex::Regex;
use reqwest::{header::HeaderValue, Client, Response, Url};
use std::{cmp::min, env, fs::File, io::Write, path::PathBuf};

pub async fn download_file(url: &str, set_process_message: impl Fn(&str)) -> Result<PathBuf> {
    let client = Client::new();
    let response = client
        .get(url)
        .send()
        .await
        .map_err(|err| anyhow::anyhow!("Failed to GET from '{}'. Error: {}", url, err))?;
    let total_size = response
        .content_length()
        .ok_or(anyhow::anyhow!("Failed to get content length from '{}'", &url))?;

    let mut file_path = env::temp_dir();
    file_path.push(get_file_name_from_response(&response)?);

    let mut file = File::create(&file_path)?;

    let mut downloaded: u64 = 0;
    let mut stream = response.bytes_stream();

    while let Some(item) = stream.next().await {
        let chunk = item.map_err(|err| anyhow::anyhow!("Failed to get next item from stream. Error: {}", err))?;
        file.write_all(&chunk)
            .map_err(|err| anyhow::anyhow!("Failed to write to file '{:?}'. Error: {}", &file_path, err))?;
        let new = min(downloaded + (chunk.len() as u64), total_size);
        downloaded = new;

        set_process_message(&format!(
            "Downloaded: {:.1} MiB / {:.1} MiB ({:.1}%)",
            downloaded as f64 / 1024.0 / 1024.0,
            total_size as f64 / 1024.0 / 1024.0,
            100_f64 * (downloaded as f64 / total_size as f64)
        ));
    }

    set_process_message(&format!("Downloaded {} to {:?}", url, &file_path));

    Ok(file_path)
}

fn get_file_name_from_response(response: &Response) -> Result<String> {
    let headers = response.headers();
    let url = response.url().as_str();

    if let Some(content_disposition) = headers.get("content-disposition") {
        get_file_name_by_content_disposition(content_disposition, url)
    } else {
        get_last_segment_from_url(url)
    }
}

fn get_last_segment_from_url(url: &str) -> Result<String> {
    let url = Url::parse(url).map_err(|err| anyhow::anyhow!("Failed to parse url '{}'. Error: {}", url, err))?;
    Ok(url.path_segments().unwrap().last().unwrap().to_string())
}

fn get_file_name_by_content_disposition(content_disposition: &HeaderValue, url: &str) -> Result<String> {
    let content_disposition = content_disposition
        .to_str()
        .map_err(|err| anyhow::anyhow!("Failed to convert content-disposition header to string. Error: {}", err))?;
    if content_disposition == "attachment" {
        get_last_segment_from_url(url)
    } else {
        let re =
            Regex::new(r"filename=([^;]+)").map_err(|err| anyhow::anyhow!("Failed to create regex. Error: {}", err))?;
        let file_name = re
            .captures(content_disposition)
            .ok_or(anyhow::anyhow!(
                "failed to match filename field from content-disposition header"
            ))?
            .get(1)
            .ok_or(anyhow::anyhow!(
                "failed to get filename field from content-disposition header"
            ))?
            .as_str()
            .replace('"', "");
        Ok(file_name)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_download_file() -> Result<()> {
        // Windows exe file
        let download_result = download_file("https://releases.arc.net/windows/ArcInstaller.exe", |_| {}).await?;
        assert!(download_result.exists());

        Ok(())
    }
}
