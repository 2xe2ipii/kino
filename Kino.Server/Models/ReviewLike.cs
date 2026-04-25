namespace Kino.Server.Models
{
    public class ReviewLike
    {
        public int Id { get; set; }
        public int ReviewId { get; set; }
        public int UserId { get; set; }
    }
}
