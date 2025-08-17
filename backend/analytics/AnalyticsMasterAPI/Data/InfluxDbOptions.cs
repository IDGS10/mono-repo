namespace AnalyticsPSQL_MasterApi.Data
{
    public class InfluxDbOptions
    {
        public string Url { get; set; } = "http://74.208.89.126:8086/";
        public string Token { get; set; } = "q3C06WE5gch-TdrdBeTeucXeZ7swoycX5XsXIFcAG05UDcyPPpH7qZbg-Ph2icpF40aEVbHYRrRgiK12UJfa0w==";
        public string Org { get; set; } = "myorg";
        public string Bucket { get; set; } = "data-iot";
    }
}
